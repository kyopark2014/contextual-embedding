### LangChain 함수로 add_documents 수행시 OpenSearch Serverless와 Managed의 동작 비교

아래 방식으로 문서를 넣었을 경우에 리턴된 ids는 OpenSearch의 _id가 아니라 id로 저장되므로 인해서 이후 "vectorstore.delete(ids)"로 삭제할 경우에 삭제에 실패합니다.

```python
vectorstore = OpenSearchVectorSearch(
    index_name=index_name,
    is_aoss = True,
    engine="faiss",  # default: nmslib
    embedding_function = bedrock_embedding,
    opensearch_url = opensearch_url,
    http_auth=awsauth,
    connection_class = RequestsHttpConnection
)  
ids = vectorstore.add_documents(documents, bulk_size = 10000)
```

managed의 경우에 add_documents 결과는 아래와 같습니다.

![image](https://github.com/user-attachments/assets/48b09fb9-04a0-4ed9-8cf2-875a6234dfea)

serverless에서 add_documents 결과는 아래와 같습니다.

![image](https://github.com/user-attachments/assets/592d280c-bf58-4c92-b35d-9093c44091a2)


[Breadcrumbsopensearch-py/USER_GUIDE.md](https://github.com/opensearch-project/opensearch-py/blob/main/USER_GUIDE.md)

