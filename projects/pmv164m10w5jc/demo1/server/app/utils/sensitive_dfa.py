"""敏感词 DFA（确定有限自动机）过滤引擎。

敏感词库从 MySQL 加载并缓存至 Redis，变更后刷新 DFA。
"""

from typing import Optional

from app.core.logging import get_logger

logger = get_logger("dfa")


class DFAFilter:
    """基于字典树（Trie）的 DFA 敏感词匹配引擎。"""

    END_KEY = "\x00"

    def __init__(self) -> None:
        self.trie: dict = {}
        self.word_count = 0

    def add_word(self, word: str) -> None:
        word = word.strip()
        if not word:
            return
        node = self.trie
        for ch in word:
            node = node.setdefault(ch, {})
        node[self.END_KEY] = True
        self.word_count += 1

    def load_words(self, words: list[str]) -> None:
        self.trie.clear()
        self.word_count = 0
        for w in words:
            self.add_word(w)
        logger.info("dfa.loaded", count=self.word_count)

    def contains(self, text: str) -> bool:
        """是否命中任一敏感词。"""
        for i in range(len(text)):
            node = self.trie
            j = i
            while j < len(text) and text[j] in node:
                node = node[text[j]]
                j += 1
                if self.END_KEY in node:
                    return True
        return False

    def find_first(self, text: str) -> Optional[str]:
        """返回首个命中的敏感词。"""
        for i in range(len(text)):
            node = self.trie
            j = i
            matched = []
            while j < len(text) and text[j] in node:
                node = node[text[j]]
                matched.append(text[j])
                j += 1
                if self.END_KEY in node:
                    return "".join(matched)
        return None

    def mask(self, text: str, repl: str = "*") -> str:
        """将命中片段替换为掩码字符。"""
        result = list(text)
        i = 0
        while i < len(result):
            node = self.trie
            j = i
            while j < len(result) and result[j] in node:
                node = node[result[j]]
                j += 1
                if self.END_KEY in node:
                    for k in range(i, j):
                        result[k] = repl
                    i = j
                    break
            else:
                i += 1
        return "".join(result)


dfa = DFAFilter()


async def refresh_dfa_from_db() -> int:
    """从 MySQL 加载敏感词并重建 DFA，返回词库数量。"""
    from sqlalchemy import select
    from app.core.database import async_session_factory
    from app.models.sensitive_word import SensitiveWord

    async with async_session_factory() as session:
        result = await session.execute(select(SensitiveWord.word).where(SensitiveWord.is_deleted == False))
        words = [row[0] for row in result.all()]
    dfa.load_words(words)
    return dfa.word_count