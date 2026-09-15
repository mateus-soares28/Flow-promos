# Integrações oficiais de conversão e webhooks

## Amazon Creators API

Fonte oficial: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction

A documentação descreve a Creators API como uma API REST de catálogo, com operações SearchItems, GetItems, GetVariations e GetBrowseNodes. Ela não documenta webhook de conversão, comissão ou relatório de pedidos de afiliados. Portanto, o FlowPromos mantém um endpoint próprio de ingestão para dados de relatórios/exportações autorizadas, mas não afirma que a Creators API envie conversões em tempo real.

## Shopee Open Platform Push Mechanism

Fonte oficial: https://open.shopee.com/developer-guide/18

O Push Mechanism é um webhook oficial para apps autorizados. Os eventos documentados incluem autorização de loja, alterações de pedidos, tracking, promoções, produtos e chat. A Shopee envia uma notificação de que os dados mudaram; o integrador deve consultar a API correspondente para obter os dados atualizados. A assinatura recomendada usa HMAC-SHA256 sobre `callback_url|request_body` e a chave do parceiro, comparada ao header `Authorization`.

O FlowPromos valida a assinatura HMAC do endpoint `/api/webhooks/shopee`, responde de forma idempotente e oferece `/api/webhooks/affiliate/:marketplace` para conversões com `affiliateTag`, `externalEventId`, `orderValue` e `commission`. A associação final a conversões de afiliado depende de o programa/conta do marketplace fornecer esses dados e permitir o callback correspondente.
