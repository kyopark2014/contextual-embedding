## Contextual Chunk Header

[Contextual Chunk Headers](https://github.com/NirDiamant/RAG_Techniques/blob/main/all_rag_techniques/contextual_chunk_headers.ipynb)에서는 chunk에 descriptive document title를 이용합니다.

```python
DOCUMENT_TITLE_PROMPT = """
INSTRUCTIONS
What is the title of the following document?

Your response MUST be the title of the document, and nothing else. DO NOT respond with anything else.

{document_title_guidance}

{truncation_message}

DOCUMENT
{document_text}
""".strip()

TRUNCATION_MESSAGE = """
Also note that the document text provided below is just the first ~{num_words} words of the document. That should be plenty for this task. Your response should still pertain to the entire document, not just the text provided below.
""".strip()

def get_document_title(document_text: str, document_title_guidance: str = "") -> str:
    """
    Extract the title of a document using a language model.

    Args:
        document_text (str): The text of the document.
        document_title_guidance (str, optional): Additional guidance for title extraction. Defaults to "".

    Returns:
        str: The extracted document title.
    """
    # Truncate the content if it's too long
    document_text, num_tokens = truncate_content(document_text, MAX_CONTENT_TOKENS)
    truncation_message = TRUNCATION_MESSAGE.format(num_words=3000) if num_tokens >= MAX_CONTENT_TOKENS else ""

    # Prepare the prompt for title extraction
    prompt = DOCUMENT_TITLE_PROMPT.format(
        document_title_guidance=document_title_guidance,
        document_text=document_text,
        truncation_message=truncation_message
    )
    chat_messages = [{"role": "user", "content": prompt}]
    
    return make_llm_call(chat_messages)
```

아래와 같이 title과 함께 chunk에 추가하여 활용합니다.


```pyhton
chunk_w_header = f"Document Title: {document_title}\n\n{chunk_text}"
```    
