# Contextual Retrieval

[Introducing Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)에서는 Contextual Embedding과 keyword 검색으로 RAG의 성능을 향상시키는 내용을 설명하고 있습니다. 


![image](https://github.com/user-attachments/assets/d6f7927b-9da5-4f6e-9408-c62150d16a28)

## Contexual Embedding

아래와 같이 chunk를 나누면 검색시 정보가 누락되어서 원한는 결과를 얻을 수 없습니다.

![image](https://github.com/user-attachments/assets/e3da7e48-ca92-42b2-bff4-e76605320de5)

제안된 prompt는 아래와 같습니다.

```python
<document> 
{{WHOLE_DOCUMENT}} 
</document> 
Here is the chunk we want to situate within the whole document 
<chunk> 
{{CHUNK_CONTENT}} 
</chunk> 
Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.
```

결과적으로 50-100 토큰이 증가한다고 합니다.
