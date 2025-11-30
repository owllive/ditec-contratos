# DITEC – Sistema de Gestão de Contratos de Licitação

## Objetivo

Sistema para gerenciar contratos de licitação de um órgão público, com:

- Cadastro de contratos
- Controle de datas de início e fim
- Vigência padrão de 1 ano, podendo ser prorrogada até 60 meses
- Aviso com 3 meses de antecedência antes do fim do contrato
- Informações de modalidade (Pregão Eletrônico, Contrato Continuado, Inexigibilidade)
- Controle de valores contratados e valores estimados de mercado

## Modelo de Contrato (desejado)

Campos principais:

- numeroContrato (string, obrigatório)
- processoLicitatorio (string, opcional)
- orgaoResponsavel (string, obrigatório)
- empresaContratada (string, obrigatório)
- cnpjEmpresa (string, obrigatório)
- objetoContrato (texto longo, obrigatório)
- dataInicio (date, obrigatório)
- dataFim (date, obrigatório)
- valorGlobal (decimal, obrigatório, > 0)
- modalidade (enum: PREGAO_ELETRONICO, CONTRATO_CONTINUADO, INEXIGIBILIDADE)
- statusContrato (enum: ATIVO, EM_ALERTA, VENCIDO, ENCERRADO)
- prazoMaximoMeses (int, padrão 60)

Campos para pesquisa de preços:

- valorEstimado (decimal, opcional)
- diferencaPercentual (decimal, opcional)

Tabela de fontes de pesquisa de preço (PriceSource):

- contractId (relacionado ao contrato)
- fonte (ex.: "Compras.gov.br", "Site de varejo")
- url (link para a origem)
- precoColetado (decimal)
- dataColeta (date)

## Regras importantes

- Avisar com pelo menos **3 meses (90 dias)** de antecedência que o contrato está para vencer.
- Se faltam 90 dias ou menos → status EM_ALERTA.
- Se já venceu → status VENCIDO.
- Contratos podem ser prorrogados até um total de 60 meses de vigência.

## Tela de visão geral

Preciso de uma rota que retorne a lista de contratos com:

- id
- numeroContrato
- orgaoResponsavel
- empresaContratada
- modalidade
- dataInicio
- dataFim
- diasRestantes (calculado)
- statusContrato
- valorGlobal
- valorEstimado
- diferencaPercentual
- emAlerta (true se diasRestantes <= 90)

Ordenado do **menor para o maior valorGlobal**, e com possibilidade de destacar em vermelho contratos com `emAlerta = true`.
