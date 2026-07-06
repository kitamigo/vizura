import re
import logging
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
from huggingface_hub import hf_hub_download
from sqlalchemy import create_engine, text
import os

logger = logging.getLogger(__name__)

# CONFIG
MODEL_REPO = "kitamigo/vizura-t5-nlq"
DEFAULT_TABLE = "sales"
DEFAULT_COLUMNS = {
    "date": "DATE",
    "revenue": "FLOAT",
    "product": "VARCHAR",
    "category": "VARCHAR",
    "quantity": "INTEGER",
    "customer_id": "INTEGER",
}

# QUERY PATTERNS (fallback for when the T5 confidence is low)
# Regex pattern, SQL template (all focused on sales/revenue analytics)
QUERY_PATTERNS = [
    (
        r"best.*(month|performing).*(this year|year)",
        "SELECT strftime('%m', date) AS month, SUM(revenue) AS total_revenue "
        "FROM {table} WHERE strftime('%Y', date) = strftime('%Y', 'now') "
        "GROUP BY month ORDER BY total_revenue DESC LIMIT 1",
    ),
    (
        r"(worst|lowest|least).*(month|performing)",
        "SELECT strftime('%m', date) AS month, SUM(revenue) AS total_revenue "
        "FROM {table} WHERE strftime('%Y', date) = strftime('%Y', 'now') "
        "GROUP BY month ORDER BY total_revenue ASC LIMIT 1",
    ),
    (
        r"total\s+(sales|revenue).*(last week|past week|this week|7 days)",
        "SELECT SUM(revenue) AS total_revenue FROM {table} "
        "WHERE date >= date('now', '-7 days')",
    ),
    (
        r"total\s+(sales|revenue).*(last month|past month|this month|30 days)",
        "SELECT SUM(revenue) AS total_revenue FROM {table} "
        "WHERE date >= date('now', '-30 days')",
    ),
    (
        r"total\s+(sales|revenue).*(last\s+\d+\s+days)",
        "SELECT SUM(revenue) AS total_revenue FROM {table} "
        "WHERE date >= date('now', '-14 days')",
    ),
    (
        r"(average|avg)\s+daily\s+(sales|revenue)",
        "SELECT AVG(revenue) AS avg_daily_revenue FROM {table}",
    ),
    (
        r"(average|avg)\s+(daily\s+)?(sales|revenue).*(last\s+\d+\s+days)",
        "SELECT AVG(revenue) AS avg_daily_revenue FROM {table} "
        "WHERE date >= date('now', '-30 days')",
    ),
    (
        r"compare\s+sales.*between\s+(\w+)\s+and\s+(\w+)",
        "SELECT strftime('%Y-%m', date) AS month, SUM(revenue) AS total_revenue "
        "FROM {table} GROUP BY month ORDER BY month",
    ),
    (
        r"(sales|revenue)\s+(in|for)\s+(january|february|march|april|may|june|july|august|september|october|november|december)",
        "SELECT strftime('%Y-%m', date) AS month, SUM(revenue) AS total_revenue "
        "FROM {table} GROUP BY month ORDER BY month",
    ),
    (
        r"(total|sum).*revenue.*(by|per)\s+month",
        "SELECT strftime('%Y-%m', date) AS month, SUM(revenue) AS total_revenue "
        "FROM {table} GROUP BY month ORDER BY month",
    ),
    (
        r"(sales|revenue)\s+trend",
        "SELECT strftime('%Y-%m', date) AS month, SUM(revenue) AS total_revenue "
        "FROM {table} GROUP BY month ORDER BY month",
    ),
    (
        r"(highest|biggest|largest).*(spike|jump|day|peak)",
        "SELECT date, revenue FROM {table} "
        "ORDER BY revenue DESC LIMIT 1",
    ),
    (
        r"(lowest|smallest|worst).*(day|drop|dip)",
        "SELECT date, revenue FROM {table} "
        "ORDER BY revenue ASC LIMIT 1",
    ),
    (
        r"anomal(y|ies)",
        "SELECT date, revenue FROM {table} "
        "WHERE revenue > (SELECT AVG(revenue) + 2 * 0 FROM {table}) "
        "OR revenue < (SELECT AVG(revenue) - 2 * 0 FROM {table})",
    ),
    (
        r"(forecast|projection|predict).*(next|30|month|week)",
        "SELECT strftime('%Y-%m', date) AS month, SUM(revenue) AS total_revenue "
        "FROM {table} GROUP BY month ORDER BY month DESC LIMIT 6",
    ),
    (
        r"(sales|revenue)\s+(by|per)\s+year",
        "SELECT strftime('%Y', date) AS year, SUM(revenue) AS total_revenue "
        "FROM {table} GROUP BY year ORDER BY year",
    ),
    (
        r"(growth|change|increase|decrease|decline).*(sales|revenue)",
        "SELECT strftime('%Y-%m', date) AS month, SUM(revenue) AS total_revenue "
        "FROM {table} GROUP BY month ORDER BY month",
    ),
    (
        r"top\s+(\d+)\s+days.*(sales|revenue)",
        "SELECT date, revenue FROM {table} "
        "ORDER BY revenue DESC LIMIT 5",
    ),
    (
        r"(total|overall).*revenue.*(all time|to date|ever)",
        "SELECT SUM(revenue) AS total_revenue FROM {table}",
    ),
    (
        r"(sales|revenue)\s*(this year|in \d{4}|for \d{4})",
        "SELECT SUM(revenue) AS total_revenue FROM {table} "
        "WHERE strftime('%Y', date) = strftime('%Y', 'now')",
    ),
    (
        r"(best|highest|top)\s+(day|date).*(sales|revenue)",
        "SELECT date, revenue FROM {table} "
        "ORDER BY revenue DESC LIMIT 1",
    ),
    (
        r"(day of week|weekday|best day).*(sales|revenue)",
        "SELECT strftime('%w', date) AS day_of_week, AVG(revenue) AS avg_revenue "
        "FROM {table} GROUP BY day_of_week ORDER BY avg_revenue DESC",
    ),
]


# NLQ ENGINE
class NLQEngine:

    def __init__(
        self,
        model_repo: str = MODEL_REPO,
        database_url: str | None = None,
        table_name: str = DEFAULT_TABLE,
        device: str | None = None,
    ):
        self.model_repo = model_repo
        self.table_name = table_name
        self.database_url = database_url
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = None
        self.model = None
        self.engine = None

        if database_url:
            self.engine = create_engine(database_url)
            logger.info(f"Database engine created for: {database_url}")

    # MODEL LOADING
    def load_model(self):
        logger.info(f"Loading T5 model from {self.model_repo} ...")
        try:
            self.tokenizer = T5Tokenizer.from_pretrained(
                self.model_repo,
                use_fast=True,
            )
            self.model = T5ForConditionalGeneration.from_pretrained(
                self.model_repo,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            ).to(self.device)
            self.model.eval()
            logger.info("T5 model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load model from HF Hub: {e}")
            logger.info("NLQ Engine will operate in fallback (rule-based) mode.")

    # CORE INFERENCE
    def _generate_sql_t5(self, question: str, max_length: int = 256) -> str:
        if self.model is None:
            return ""

        prefix = "translate English to SQL: "
        input_text = prefix + question

        inputs = self.tokenizer(
            input_text,
            return_tensors="pt",
            truncation=True,
            max_length=128,
            padding="max_length",
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model.generate(
                input_ids=inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_length=max_length,
                num_beams=4,
                early_stopping=True,
                temperature=0.7,
                do_sample=False,
            )

        sql = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return sql.strip()

    # FALLBACK: RULE-BASED SQL GENERATION
    def _generate_sql_rule_based(self, question: str) -> str:
        question_lower = question.lower().strip()

        for pattern, template in QUERY_PATTERNS:
            if re.search(pattern, question_lower):
                sql = template.format(table=self.table_name)
                return sql

        # Default: return monthly revenue summary
        return (
            f"SELECT strftime('%Y-%m', date) AS month, "
            f"SUM(revenue) AS total_revenue "
            f"FROM {self.table_name} "
            f"GROUP BY month ORDER BY month DESC LIMIT 12"
        )

    # PUBLIC API
    def generate_query(self, question: str) -> dict:
        # Tries T5 first
        sql = self._generate_sql_t5(question)

        mode = "t5"
        if not sql or len(sql) < 10:
            sql = self._generate_sql_rule_based(question)
            mode = "rule_based"
            logger.info("Using rule-based fallback for query generation.")

        # Replaces table name placeholder if needed
        sql = sql.replace("{table}", self.table_name)

        result = {
            "question": question,
            "sql": sql,
            "answer": None,
            "data": None,
            "mode": mode,
        }

        # Executes if we have a database connection
        if self.engine:
            try:
                with self.engine.connect() as conn:
                    rows = conn.execute(text(sql)).fetchall()
                    columns = list(rows[0]._fields) if rows else []
                    data = [dict(zip(columns, row)) for row in rows]
                    result["data"] = data
                    result["answer"] = self._format_answer(question, data)
            except Exception as e:
                logger.error(f"SQL execution failed: {e}")
                result["answer"] = (
                    f"I understood your question but couldn't retrieve the data. "
                    f"Generated SQL: {sql}"
                )
        else:
            # No database — returns the SQL with context
            result["answer"] = self._format_answer_no_db(question, sql)

        return result

    # ANSWER FORMATTING
    def _format_answer(self, question: str, data: list[dict]) -> str:
        if not data:
            return "No data found matching your query."

        # Single row results
        if len(data) == 1:
            row = data[0]
            vals = list(row.values())
            keys = list(row.keys())

            if len(vals) == 1:
                return f"The result is: {vals[0]}"

            return f"Result: {row}"

        # Multi-row results — summarise
        if len(data) <= 10:
            lines = [f"• {row}" for row in data]
            return f"Here are the results:\n" + "\n".join(lines)

        return f"Found {len(data)} matching records. Top result: {data[0]}"

    def _format_answer_no_db(self, question: str, sql: str) -> str:
        return (
            f"I understand your question: '{question}'. "
            f"The generated SQL query is: {sql}. "
            f"Connect a database to execute this query and see results."
        )


# SINGLETON
_nlq_engine = None


def get_nlq_engine(
    model_repo: str = MODEL_REPO,
    database_url: str | None = None,
    table_name: str = "sales",
) -> NLQEngine:
    global _nlq_engine
    if _nlq_engine is None:
        _nlq_engine = NLQEngine(
            model_repo=model_repo,
            database_url=database_url or os.getenv("DATABASE_URL"),
            table_name=table_name,
        )
        _nlq_engine.load_model()
    return _nlq_engine