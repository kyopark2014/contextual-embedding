## Fusion Retrieval

[Fusion Retrieval in Document Search](https://github.com/NirDiamant/RAG_Techniques/blob/main/all_rag_techniques/fusion_retrieval.ipynb)에서는 vector search와 BM25를 이용한 keyword 검색을 함게 사용하는것을 설명합니다. 이를 통해 문서검색의 관련과 전체 품질을 향상시킬수 있습니다.

![image](https://github.com/user-attachments/assets/173d3149-d948-4e67-b7bc-ff4c62138f2f)


```python
def fusion_retrieval(vectorstore, bm25, query: str, k: int = 5, alpha: float = 0.5) -> List[Document]:
    """
    Perform fusion retrieval combining keyword-based (BM25) and vector-based search.

    Args:
    vectorstore (VectorStore): The vectorstore containing the documents.
    bm25 (BM25Okapi): Pre-computed BM25 index.
    query (str): The query string.
    k (int): The number of documents to retrieve.
    alpha (float): The weight for vector search scores (1-alpha will be the weight for BM25 scores).

    Returns:
    List[Document]: The top k documents based on the combined scores.
    """
    # Step 1: Get all documents from the vectorstore
    all_docs = vectorstore.similarity_search("", k=vectorstore.index.ntotal)

    # Step 2: Perform BM25 search
    bm25_scores = bm25.get_scores(query.split())

    # Step 3: Perform vector search
    vector_results = vectorstore.similarity_search_with_score(query, k=len(all_docs))
    
    # Step 4: Normalize scores
    vector_scores = np.array([score for _, score in vector_results])
    vector_scores = 1 - (vector_scores - np.min(vector_scores)) / (np.max(vector_scores) - np.min(vector_scores))

    bm25_scores = (bm25_scores - np.min(bm25_scores)) / (np.max(bm25_scores) - np.min(bm25_scores))

    # Step 5: Combine scores
    combined_scores = alpha * vector_scores + (1 - alpha) * bm25_scores  

    # Step 6: Rank documents
    sorted_indices = np.argsort(combined_scores)[::-1]
    
    # Step 7: Return top k documents
    return [all_docs[i] for i in sorted_indices[:k]]
```
