from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.database import PromptLibraryItem


class PromptLibraryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, item_id: int, user_id: int) -> PromptLibraryItem | None:
        return (
            self.db.query(PromptLibraryItem)
            .filter(PromptLibraryItem.id == item_id, PromptLibraryItem.user_id == user_id)
            .first()
        )

    def list_all(
        self,
        user_id: int,
        category: str | None = None,
        search: str | None = None,
    ) -> list[PromptLibraryItem]:
        query = self.db.query(PromptLibraryItem).filter(PromptLibraryItem.user_id == user_id)
        if category:
            query = query.filter(PromptLibraryItem.category == category)
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                (PromptLibraryItem.title.ilike(pattern))
                | (PromptLibraryItem.prompt.ilike(pattern))
            )
        return query.order_by(desc(PromptLibraryItem.updated_at)).all()

    def count(self, user_id: int) -> int:
        return self.db.query(PromptLibraryItem).filter(PromptLibraryItem.user_id == user_id).count()

    def create(self, item: PromptLibraryItem) -> PromptLibraryItem:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update(self, item: PromptLibraryItem) -> PromptLibraryItem:
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: PromptLibraryItem) -> None:
        self.db.delete(item)
        self.db.commit()
