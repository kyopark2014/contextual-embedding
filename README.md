# 정보를 분석하는 Agent 구현하기

<p align="left">
    <a href="https://hits.seeyoufarm.com"><img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fkyopark2014%2Finfo-analytic-agent&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false)](https://hits.seeyoufarm.com"/></a>
    <img alt="License" src="https://img.shields.io/badge/LICENSE-MIT-green">
</p>


여기서는 정보를 분석하는 Agent 구현하기에 대해 설명합니다.

## 프로젝트 Hold

여기에서는 OpenSearch Serverless를 활용해서 정보를 분석하는 Agent를 구현하려고 하였으나, 아래와 같이 LangChain에서 add_document 함수가 OpenSearch Serverless에서 문제가 있어서, 방법을 우회하거나 LangChain에서 업그레이드할 때까지 Hold하려고 합니다.


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




# Header/Footer

[PDF에서 Header와 Footer 처리](https://github.com/kyopark2014/korean-chatbot-using-amazon-bedrock/blob/main/pdf-header-footer.md)와 같이 Rect를 이용해 pdf에서 header와 footer를 정의합니다.
