# 정보를 분석하는 Agent 구현하기

<p align="left">
    <a href="https://hits.seeyoufarm.com"><img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fkyopark2014%2Finfo-analytic-agent&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false)](https://hits.seeyoufarm.com"/></a>
    <img alt="License" src="https://img.shields.io/badge/LICENSE-MIT-green">
</p>


여기서는 정보를 분석하는 Agent 구현하기에 대해 설명합니다.


## Contextual Chunk

[Contextual Chunk Header](./contextual-chunk-headers.md)와 [Contextual Retrieval](./contextual-retrieval.md)와 같이 문서를 chunk할 때에 chunk에 대한 설명을 포함하면 검색의 정확도를 높일 수 있습니다. 

### Contextual Retrieval 결과

아래와 같이 [Contextual Retrieval](./contextual-retrieval.md)의 prompt를 기반으로 요약을 하면 아래와 같이 구현할 수 있습니다.

```python
def get_contexual_docs(whole_doc, splitted_docs):
    docs = []
    for i, doc in enumerate(splitted_docs):        
        chat = get_contexual_retrieval_chat()
        
        if isKorean(doc.page_content)==True:
            #contextual_template = (
            #    "<document> tag는 전체 문서입니다."
            #    "<document>"
            #    "{WHOLE_DOCUMENT}"
            #    "</document>"
            #    "<chunk> tag는 관심을 가지는 문서로서 전체 문서의 일부분입니다."
            #    "<chunk>"
            #    "{CHUNK_CONTENT}"
            #    "</chunk>"
            #    "관심을 가지는 문서의 상황을 전체 문서를 활용하여 간단하고 명확하게 설명합니다."
            #    "답변은 간단한 문맥만 포함하고 다른 것은 포함하지 않습니다."
            #    "결과는 <result> tag를 붙여주세요."
            #)
            contextual_template = (
                "<document>"
                "{WHOLE_DOCUMENT}"
                "</document>"
                "Here is the chunk we want to situate within the whole document."
                "<chunk>"
                "{CHUNK_CONTENT}"
                "</chunk>"
                "Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk."
                "Answer only with the succinct context and nothing else."
                "Respond in Korean "
                "Put it in <result> tags."
            )
        else:
            contextual_template = (
                "<document>"
                "{WHOLE_DOCUMENT}"
                "</document>"
                "Here is the chunk we want to situate within the whole document."
                "<chunk>"
                "{CHUNK_CONTENT}"
                "</chunk>"
                "Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk."
                "Answer only with the succinct context and nothing else."
                "Put it in <result> tags."
            )          
    
        contextual_prompt = ChatPromptTemplate([
            ('human', contextual_template)
        ])
        contexual_chain = contextual_prompt | chat
            
        response = contexual_chain.invoke(
            {
                "WHOLE_DOCUMENT": whole_doc.page_content,
                "CHUNK_CONTENT": doc.page_content
            }
        )
        output = response.content
        contextualized_chunk = output[output.find('<result>')+8:len(output)-9]
        
        docs.append(
            Document(
                page_content=contextualized_chunk+"\n\n"+doc.page_content,
                metadata=doc.metadata
            )
        )
    return docs
```

#### Case1 - Desiable Case

아래는 보험문서인 [book_SMMDINLM239.pdf](./contents/book_SMMDINLM239.pdf)의 Chunk입니다. 

```text
전문금융소비자를 말합니다.
• 보험계약을 체결할 때 청약서에 자필서명을 하지 않았거나 청약할 때 약관과 계약자 보관용 청약서를 전달받지 못한  
경우 또는 약관의 중요한 내용을 설명 받지 못한 경우에는 계약자는 계약이 성립한 날부터 3개월 이내에 계약을 취소할 
수 있습니다.
• 고의로 인한 사고 등 약관상 일반적으로 보장하지 않는 사항 및 위험직종 등 가입이 거절되거나 제한될 수 있는 사항에  
관하여 약관을 읽어보시기 바랍니다.
•보험은 은행상품과 달리 위험을 보장해 드리는 상품이므로 해지환급금이 납입하신 보험료보다 적거나 없을 수 있습니다.
•이 상품은 배당이 없는 무배당 상품입니다.
• 이 보험계약은 예금자보호법에 따라 예금보험공사가 보호하되, 보호 한도는 본 보험회사에 있는 귀하의 모든 예금보호 
대상 금융상품의 해지환급금(또는 만기보험금이나 사고보험금)에 기타지급금을 합하여 1인당 최고 5천만원이며,  
5천만원을 초과하는 나머지 금액은 보호하지 않습니다. (다만, 보험계약자 및 보험료 납부자가 법인이면 보호되지  
않습니다)
• 기존 계약을 해지하고 신계약으로 청약할 때에는 보험인수가 거절되거나 보험료가 인상될 수 있으며 보장내용이 달라질 
수 있습니다.
•보험계약 체결 전에 상품설명서와 약관을 읽어보시기 바랍니다.
• 보험상담이 필요하거나 불만사항이 있을 때에는 회사 홈페이지(www.kyobo.co.kr) 또는 콜센터(1588-1001)로   
연락주시기 바랍니다. 만일 회사의 처리 결과에 이의가 있으면 금융감독원 콜센터(1332) 등에 민원 또는 분쟁조정을  
신청할 수 있습니다.
• 어떠한 명목으로든 금융회사나 정부기관은 전화, 메신저, 카카오톡, 인터넷 등을 이용하여 비밀번호나 금융거래정보를 
묻지 않습니다. 전화, 메신저, 카카오톡, 인터넷 등을 이용해 금융기관 또는 검찰, 경찰, 금감원을 사칭한 보이스피싱 및
```

이때 얻어진 contexualized chunk의 예는 아래와 같습니다. 이때 전체 문서에서 해당 chunk에 대한 전반적인 정보를 잘 요약하고 있습니다.

```text
이 문서는 보험 상품에 대한 정보와 주의사항을 설명하고 있습니다. 이 부분은 보험 계약 체결 시 유의사항과 보험 관련 법적 권리 및 제한 사항을 자세히 설명하고 있습니다.
```

#### Case 2 - Undesirable Case

아래는 같은 보험 문서의 다른 chunk입니다.

```text
묻지 않습니다. 전화, 메신저, 카카오톡, 인터넷 등을 이용해 금융기관 또는 검찰, 경찰, 금감원을 사칭한 보이스피싱 및 
금융사기 피해를 입지 않도록 유의하시기 바랍니다. 금융사기 피해관련 사항은 경찰청(112), 금융감독원(1332)으로 
즉시 신고하시기 바랍니다.
• 법령 및 내부통제기준에 따른 광고관련절차를 준수하였습니다.
무배당  교보다이렉트플러스건강보험(갱신형)  7교보생명은 
더 좋은 상품과 서비스 로
고객님의 꿈과 행복 을 지켜나가겠습니다
Asia Insurance Industry Awards Technology Initiative of the Year
올해의 디지털 기술상 (2019)
Consumer Centered Management
소비자중심경영 8회 연속 인증 (2021)
명예의 전당 헌정 (2019)
Korean Sustainability Index
지속가능성지수 11년 연속 1위  (2020)  
명예의 전당 헌정 (2019)
Fitch Ratings  (2013~2021)
Moody’s Investors Service  (2015~2021)
세계적인 신용평가사들로부터 국내 최고 신용등급 획득
```

이때 얻어진 contextualized chunk의 내용은 chunk와 관계없이 전체 문서의 영향을 받아서 아래와 같이 chunk의 내용을 충분히 설명하지 못하고 있습니다.

```text
이 문서는 여성 기준 40세, 20년 만기, 전기납, 월납, 최초계약, 주계약 가입금액 1,500만원, 세전 보험상품의 정보를 제공하고 있습니다. 이 문서의 마지막 부분에는 보험사의 광고 및 수상 내역이 포함되어 있습니다.
```


#### Case 3 - Desired Case

아래의 경우는 기업의 지분율에 대한 데이터로 아래 chunk에는 단순히 지분율 열거하고 있습니다.

```text
structure as of 3 January 2024 (date of last disclosure) is as follows:
Suzano Holding SA, Brazil - 27.76%  
David Feffer - 4.04%  
Daniel Feffer - 3.63%  
Jorge Feffer - 3.60%  
Ruben Feffer - 3.54%  
Alden Fundo De Investimento Em Ações, Brazil - 1.98%  
Other investors hold the remaining 55.45%
Suzano Holding SA is majority-owned by the founding Feffer family
Ultimate Beneficial Owners
and/or Persons with Significant
ControlFilings show that the beneficial owners/persons with significant control
are members of the Feffer family, namely David Feffer, Daniel Feffer,
Jorge Feffer, and Ruben Feffer
Directors Executive Directors:  
Walter Schalka - Chief Executive Officer  
Aires Galhardo - Executive Officer - Pulp Operation  
Carlos Aníbal de Almeida Jr - Executive Officer - Forestry, Logistics and
Procurement  
Christian Orglmeister - Executive Officer - New Businesses, Strategy, IT,
Digital and Communication
```

아래는 contexualized chunk입니다. 원본 chunk에 없는 회사명과 ownership에 대한 정보를 포함하고 있습니다.

```text
This chunk provides details on the ownership structure and key executives of Suzano SA, 
the company that is the subject of the overall document.
It is likely included to provide background information on the company's corporate structure and leadership.
```

#### Case 3 - Desired Case

아래는 어떤 기업의 

```text
Type of Compilation Consolidated Consolidated Consolidated
Currency / UnitsBRL ‘000 (USD 1 =
BRL 5.04)BRL ‘000 (USD 1 =
BRL 5.29)BRL ‘000 (USD 1 =
BRL 5.64)
Turnover 29,384,030 49,830,946 40,965,431
Gross results 11,082,919 25,009,658 20,349,843
Depreciation (5,294,748) (7,206,125) (6,879,132)
Operating profit (loss) 9,058,460 22,222,781 18,180,191
Interest income 1,215,644 967,010 272,556
Interest expense (3,483,674) (4,590,370) (4,221,301)
Other income (expense) 3,511,470 6,432,800 (9,347,234)
Profit (loss) before tax 12,569,930 8,832,957 (17,642,129)
Tax (2,978,271) (197,425) (6,928,009)
Net profit (loss) 9,591,659 23,394,887 8,635,532
Net profit (loss) attributable to
minorities/non-controlling
interests14,154 13,270 9,146
Net profit (loss) attributable to the
company9,575,938 23,119,235 8,751,864
Long-term assets 103,391,275 96,075,318 84,872,211
Fixed assets 57,718,542 50,656,634 38,169,703
Goodwill and other intangibles 14,877,234 15,192,971 16,034,339
```
아래는 contexualized chunk입니다.

``text
This chunk provides detailed financial information about Suzano SA, 
including its turnover, gross results, operating profit, net profit, and asset details. 
It is part of the overall assessment and rating of Suzano SA presented in the document.
```

### Header/Footer

[PDF에서 Header와 Footer 처리](https://github.com/kyopark2014/korean-chatbot-using-amazon-bedrock/blob/main/pdf-header-footer.md)와 같이 Rect를 이용해 pdf에서 header와 footer를 정의합니다.

### 문서 삭제시 주의점

[LangChain 함수로 add_documents 수행시 OpenSearch Serverless와 Managed의 동작 비교](./langchain-and-opensearch-serverless-issue.md)와 같이 버그성으로 보이는 id 이슈가 있어서 LangChain이 업데이트가 되면 코드 수정이 필요할 수 있습니다.
