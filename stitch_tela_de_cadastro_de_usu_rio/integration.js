const API_BASE = `${window.location.origin}/api`;

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function createContract(payload) {
  const response = await fetch(`${API_BASE}/contratos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(body.message || 'Não foi possível criar o contrato');
  }

  return response.json();
}

async function fetchOverview() {
  const response = await fetch(`${API_BASE}/contratos/visao-geral`);
  if (!response.ok) throw new Error('Erro ao carregar visão geral');
  return response.json();
}

async function fetchContracts() {
  const response = await fetch(`${API_BASE}/contratos`);
  if (!response.ok) throw new Error('Erro ao carregar contratos');
  return response.json();
}

async function registerPriceResearch(contractId, fontes) {
  const response = await fetch(`${API_BASE}/contratos/${contractId}/pesquisa-precos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fontes }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(body.message || 'Não foi possível registrar a pesquisa de preços');
  }

  return response.json();
}

function renderStatusPill(status) {
  const map = {
    ATIVO: { bg: 'bg-green-100 text-green-700', label: 'Ativo' },
    EM_ALERTA: { bg: 'bg-amber-100 text-amber-700', label: 'Em alerta' },
    VENCIDO: { bg: 'bg-red-100 text-red-700', label: 'Vencido' },
    ENCERRADO: { bg: 'bg-gray-100 text-gray-700', label: 'Encerrado' },
  };
  const style = map[status] || map.ENCERRADO;
  return `<span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.bg}">
    <span class="w-2 h-2 rounded-full bg-current"></span>${style.label}
  </span>`;
}

function renderContractsList(container, items) {
  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = '<p class="text-sm text-gray-500">Nenhum contrato encontrado.</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm space-y-3 border border-gray-100 dark:border-gray-800';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-500">Contrato</p>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${item.numeroContrato}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">${item.orgaoResponsavel} • ${item.empresaContratada}</p>
        </div>
        ${renderStatusPill(item.statusContrato)}
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-200">
        <div class="flex flex-col gap-1">
          <span class="text-gray-500">Modalidade</span>
          <span class="font-medium">${item.modalidade}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-gray-500">Valor Global</span>
          <span class="font-semibold">${formatCurrency(item.valorGlobal)}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-gray-500">Período</span>
          <span class="font-medium">${item.dataInicio?.slice(0, 10)} → ${item.dataFim?.slice(0, 10)}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-gray-500">Dias restantes</span>
          <span class="font-semibold ${item.emAlerta ? 'text-amber-600' : ''}">${item.diasRestantes ?? '-'} dia(s)</span>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-3 text-sm">
        <div class="flex flex-col gap-1">
          <span class="text-gray-500">Valor estimado</span>
          <span class="font-semibold">${item.valorEstimado ? formatCurrency(item.valorEstimado) : '—'}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-gray-500">Diferença %</span>
          <span class="font-semibold">${item.diferencaPercentual ?? '—'}%</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-gray-500">Alertas</span>
          <span class="font-semibold">${item.emAlerta ? '⚠️ Prazo curto' : 'Sem alertas'}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function initContractsListPage() {
  const container = document.querySelector('[data-contracts-list]');
  const reloadButton = document.querySelector('[data-reload-contracts]');
  const errorBox = document.querySelector('[data-contracts-error]');

  async function load() {
    try {
      errorBox.textContent = '';
      const items = await fetchOverview();
      renderContractsList(container, items);
    } catch (err) {
      console.error(err);
      errorBox.textContent = err.message || 'Falha ao carregar contratos';
    }
  }

  reloadButton?.addEventListener('click', load);
  load();
}

function initAddContractPage() {
  const form = document.getElementById('contract-integration-form');
  const statusBox = document.getElementById('contract-integration-feedback');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusBox.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries());

    const payload = {
      numeroContrato: data.numeroContrato,
      processoLicitatorio: data.processoLicitatorio || undefined,
      orgaoResponsavel: data.orgaoResponsavel,
      empresaContratada: data.empresaContratada,
      cnpjEmpresa: data.cnpjEmpresa,
      objetoContrato: data.objetoContrato,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      valorGlobal: data.valorGlobal ? Number(data.valorGlobal) : undefined,
      modalidade: data.modalidade,
    };

    try {
      form.querySelector('button[type="submit"]').disabled = true;
      await createContract(payload);
      statusBox.classList.remove('text-red-600');
      statusBox.classList.add('text-green-700');
      statusBox.textContent = 'Contrato criado com sucesso!';
      form.reset();
    } catch (err) {
      console.error(err);
      statusBox.classList.remove('text-green-700');
      statusBox.classList.add('text-red-600');
      statusBox.textContent = err.message || 'Erro ao salvar contrato';
    } finally {
      form.querySelector('button[type="submit"]').disabled = false;
    }
  });
}

function addPriceRow(container) {
  const row = document.createElement('div');
  row.className = 'grid grid-cols-12 gap-2 items-end';
  row.innerHTML = `
    <div class="col-span-4">
      <label class="text-sm font-medium text-gray-700">Fonte</label>
      <input name="fonte" required class="form-input w-full rounded-lg border border-slate-300 bg-white p-2" placeholder="Portal, fornecedor, etc" />
    </div>
    <div class="col-span-4">
      <label class="text-sm font-medium text-gray-700">URL</label>
      <input name="url" class="form-input w-full rounded-lg border border-slate-300 bg-white p-2" placeholder="https://" />
    </div>
    <div class="col-span-3">
      <label class="text-sm font-medium text-gray-700">Preço coletado</label>
      <input name="precoColetado" type="number" step="0.01" required class="form-input w-full rounded-lg border border-slate-300 bg-white p-2" />
    </div>
    <div class="col-span-1 flex items-center justify-center">
      <button type="button" class="text-red-600 text-sm" aria-label="Remover" title="Remover">✕</button>
    </div>
  `;

  row.querySelector('button')?.addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function initPriceResearchPage() {
  const form = document.getElementById('price-research-form');
  const rowsContainer = document.querySelector('[data-price-rows]');
  const addRowButton = document.querySelector('[data-add-price-row]');
  const statusBox = document.getElementById('price-research-feedback');
  const contractSelect = document.getElementById('price-research-contract');

  if (!form || !rowsContainer || !addRowButton) return;

  addRowButton.addEventListener('click', () => addPriceRow(rowsContainer));
  addPriceRow(rowsContainer);

  fetchContracts()
    .then((result) => {
      const items = result?.data || result || [];
      contractSelect.innerHTML = '<option value="">Selecione um contrato</option>';
      items.forEach((c) => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = `${c.numeroContrato} — ${c.orgaoResponsavel}`;
        contractSelect.appendChild(option);
      });
    })
    .catch(() => {
      contractSelect.innerHTML = '<option value="">Erro ao carregar contratos</option>';
    });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusBox.textContent = '';
    const contractId = contractSelect.value;
    if (!contractId) {
      statusBox.textContent = 'Selecione um contrato válido';
      return;
    }

    const fontes = Array.from(rowsContainer.children).map((row) => {
      const fonte = row.querySelector('input[name="fonte"]')?.value;
      const url = row.querySelector('input[name="url"]')?.value;
      const preco = row.querySelector('input[name="precoColetado"]')?.value;
      return {
        fonte,
        url: url || undefined,
        precoColetado: preco ? Number(preco) : undefined,
        dataColeta: new Date().toISOString(),
      };
    }).filter((item) => item.fonte && item.precoColetado !== undefined);

    if (!fontes.length) {
      statusBox.textContent = 'Adicione pelo menos uma fonte de preço';
      return;
    }

    try {
      form.querySelector('button[type="submit"]').disabled = true;
      await registerPriceResearch(contractId, fontes);
      statusBox.classList.remove('text-red-600');
      statusBox.classList.add('text-green-700');
      statusBox.textContent = 'Pesquisa registrada e contrato atualizado!';
      rowsContainer.innerHTML = '';
      addPriceRow(rowsContainer);
      form.reset();
    } catch (err) {
      console.error(err);
      statusBox.classList.remove('text-green-700');
      statusBox.classList.add('text-red-600');
      statusBox.textContent = err.message || 'Erro ao registrar pesquisa';
    } finally {
      form.querySelector('button[type="submit"]').disabled = false;
    }
  });
}

function initPage() {
  const page = document.body.dataset.page || window.STITCH_PAGE;
  if (page === 'lista-contratos') return initContractsListPage();
  if (page === 'adicionar-contrato') return initAddContractPage();
  if (page === 'pesquisa-precos') return initPriceResearchPage();
}

document.addEventListener('DOMContentLoaded', initPage);
