import csv
import io
import json
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.db.database import Evaluation


class ExportService:
    def export(self, evaluation: Evaluation, fmt: str) -> tuple[bytes, str, str]:
        exporters = {
            "json": self._export_json,
            "markdown": self._export_markdown,
            "csv": self._export_csv,
            "pdf": self._export_pdf,
        }
        exporter = exporters.get(fmt)
        if not exporter:
            raise ValueError(f"Unsupported format: {fmt}")
        return exporter(evaluation)

    def _export_json(self, evaluation: Evaluation) -> tuple[bytes, str, str]:
        data = {
            "id": evaluation.id,
            "title": evaluation.title,
            "prompt": evaluation.prompt,
            "system_prompt": evaluation.system_prompt,
            "category": evaluation.category,
            "models_used": evaluation.models_used,
            "analysis": evaluation.analysis,
            "created_at": evaluation.created_at.isoformat(),
            "responses": [
                {
                    "model_name": r.model_name,
                    "provider": r.provider,
                    "content": r.content,
                    "scores": r.scores,
                    "hallucination_analysis": r.hallucination_analysis,
                    "latency_ms": r.latency_ms,
                }
                for r in evaluation.responses
            ],
        }
        content = json.dumps(data, indent=2).encode("utf-8")
        filename = f"evaluation_{evaluation.id}.json"
        return content, "application/json", filename

    def _export_markdown(self, evaluation: Evaluation) -> tuple[bytes, str, str]:
        lines = [
            f"# {evaluation.title}",
            "",
            f"**Date:** {evaluation.created_at.strftime('%Y-%m-%d %H:%M')}",
            f"**Category:** {evaluation.category}",
            "",
            "## Prompt",
            evaluation.prompt,
            "",
        ]
        if evaluation.system_prompt:
            lines.extend(["## System Prompt", evaluation.system_prompt, ""])

        if evaluation.analysis:
            lines.extend(["## AI Analysis", f"**Summary:** {evaluation.analysis.get('summary', '')}", ""])
            for key in ["strengths", "weaknesses", "recommended_improvements", "prompt_optimization_suggestions"]:
                items = evaluation.analysis.get(key, [])
                if items:
                    lines.append(f"### {key.replace('_', ' ').title()}")
                    lines.extend(f"- {item}" for item in items)
                    lines.append("")

        for resp in evaluation.responses:
            lines.extend([
                f"## {resp.model_name}",
                f"**Overall Score:** {resp.scores.get('overall', 'N/A')}",
                "",
                resp.content,
                "",
                "### Scores",
            ])
            for metric, score in resp.scores.items():
                lines.append(f"- **{metric.replace('_', ' ').title()}:** {score}")
            lines.append("")

        content = "\n".join(lines).encode("utf-8")
        return content, "text/markdown", f"evaluation_{evaluation.id}.md"

    def _export_csv(self, evaluation: Evaluation) -> tuple[bytes, str, str]:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "evaluation_id", "title", "model", "provider", "overall_score",
            "accuracy", "completeness", "reasoning", "instruction_following",
            "safety", "conciseness", "readability", "hallucination_risk", "latency_ms",
        ])
        for resp in evaluation.responses:
            s = resp.scores or {}
            writer.writerow([
                evaluation.id, evaluation.title, resp.model_name, resp.provider,
                s.get("overall", ""), s.get("accuracy", ""), s.get("completeness", ""),
                s.get("reasoning", ""), s.get("instruction_following", ""),
                s.get("safety", ""), s.get("conciseness", ""), s.get("readability", ""),
                s.get("hallucination_risk", ""), resp.latency_ms,
            ])
        return output.getvalue().encode("utf-8"), "text/csv", f"evaluation_{evaluation.id}.csv"

    def _export_pdf(self, evaluation: Evaluation) -> tuple[bytes, str, str]:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75 * inch)
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=18, spaceAfter=12)
        elements = [
            Paragraph(evaluation.title, title_style),
            Paragraph(f"Date: {evaluation.created_at.strftime('%Y-%m-%d %H:%M')}", styles["Normal"]),
            Spacer(1, 12),
            Paragraph("Prompt", styles["Heading2"]),
            Paragraph(evaluation.prompt.replace("\n", "<br/>"), styles["Normal"]),
            Spacer(1, 12),
        ]

        if evaluation.analysis and evaluation.analysis.get("summary"):
            elements.extend([
                Paragraph("AI Analysis", styles["Heading2"]),
                Paragraph(evaluation.analysis["summary"], styles["Normal"]),
                Spacer(1, 12),
            ])

        for resp in evaluation.responses:
            elements.append(Paragraph(f"{resp.model_name} — Score: {resp.scores.get('overall', 'N/A')}", styles["Heading2"]))
            elements.append(Paragraph(resp.content[:2000].replace("\n", "<br/>"), styles["Normal"]))
            elements.append(Spacer(1, 12))

            if resp.scores:
                table_data = [["Metric", "Score"]] + [
                    [k.replace("_", " ").title(), str(v)] for k, v in resp.scores.items()
                ]
                table = Table(table_data, colWidths=[3 * inch, 1.5 * inch])
                table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6366f1")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                ]))
                elements.append(table)
                elements.append(Spacer(1, 12))

        doc.build(elements)
        return buffer.getvalue(), "application/pdf", f"evaluation_{evaluation.id}.pdf"
