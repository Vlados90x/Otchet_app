const today = new Date().toISOString().slice(0, 10);
const state = {
  items: [],
  pendingImages: [],
};

const elements = {
  printButton: document.querySelector('#printButton'),
  clientName: document.querySelector('#clientName'),
  projectName: document.querySelector('#projectName'),
  period: document.querySelector('#period'),
  entryForm: document.querySelector('#entryForm'),
  entryDate: document.querySelector('#entryDate'),
  entryTitle: document.querySelector('#entryTitle'),
  entryDescription: document.querySelector('#entryDescription'),
  entryImages: document.querySelector('#entryImages'),
  pendingImages: document.querySelector('#pendingImages'),
  reportProject: document.querySelector('#reportProject'),
  reportClient: document.querySelector('#reportClient'),
  reportPeriod: document.querySelector('#reportPeriod'),
  itemsCount: document.querySelector('#itemsCount'),
  datesCount: document.querySelector('#datesCount'),
  imagesCount: document.querySelector('#imagesCount'),
  emptyState: document.querySelector('#emptyState'),
  timeline: document.querySelector('#timeline'),
};

elements.entryDate.value = today;

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateValue}T00:00:00`));
}

function groupByDate(items) {
  return items
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || a.createdAt - b.createdAt)
    .reduce((groups, item) => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }

      groups[item.date].push(item);
      return groups;
    }, {});
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };

    return replacements[character];
  });
}

function renderPendingImages() {
  elements.pendingImages.innerHTML = state.pendingImages
    .map(
      (image, index) => `
        <button type="button" data-image-index="${index}">
          <img src="${image.src}" alt="${escapeHtml(image.name)}" />
          <span>Удалить</span>
        </button>
      `,
    )
    .join('');
}

function renderReportHeader() {
  elements.reportProject.textContent = elements.projectName.value.trim() || 'Название проекта / сайта';
  elements.reportClient.textContent = elements.clientName.value.trim() || 'Клиент не указан';
  elements.reportPeriod.textContent = elements.period.value.trim() || 'Период не указан';
}

function renderReport() {
  const groupedItems = groupByDate(state.items);
  const totalImages = state.items.reduce((sum, item) => sum + item.images.length, 0);

  elements.itemsCount.textContent = state.items.length;
  elements.datesCount.textContent = Object.keys(groupedItems).length;
  elements.imagesCount.textContent = totalImages;
  elements.emptyState.hidden = state.items.length > 0;

  elements.timeline.innerHTML = Object.entries(groupedItems)
    .map(
      ([date, dateItems]) => `
        <section class="date-group">
          <h3>${formatDate(date)}</h3>
          <ol>
            ${dateItems
              .map(
                (item, index) => `
                  <li class="report-item">
                    <div class="item-heading">
                      <span>${index + 1}</span>
                      <h4>${escapeHtml(item.title)}</h4>
                      <button class="icon-button no-print" type="button" aria-label="Удалить пункт" data-item-id="${item.id}">🗑</button>
                    </div>
                    <p>${escapeHtml(item.description)}</p>
                    ${
                      item.images.length > 0
                        ? `<div class="image-grid">
                            ${item.images
                              .map(
                                (image) => `
                                  <figure>
                                    <img src="${image.src}" alt="${escapeHtml(image.name)}" />
                                    <figcaption>${escapeHtml(image.name)}</figcaption>
                                  </figure>
                                `,
                              )
                              .join('')}
                           </div>`
                        : ''
                    }
                  </li>
                `,
              )
              .join('')}
          </ol>
        </section>
      `,
    )
    .join('');
}

function addItem(event) {
  event.preventDefault();

  const date = elements.entryDate.value;
  const title = elements.entryTitle.value.trim();
  const description = elements.entryDescription.value.trim();

  if (!date || !title || !description) {
    return;
  }

  state.items.push({
    id: crypto.randomUUID(),
    date,
    title,
    description,
    images: [...state.pendingImages],
    createdAt: Date.now(),
  });

  elements.entryTitle.value = '';
  elements.entryDescription.value = '';
  elements.entryImages.value = '';
  state.pendingImages = [];
  renderPendingImages();
  renderReport();
}

function handleImages(files) {
  const selectedFiles = Array.from(files || []);
  Promise.all(
    selectedFiles.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, src: reader.result });
          reader.readAsDataURL(file);
        }),
    ),
  ).then((images) => {
    state.pendingImages = [...state.pendingImages, ...images];
    renderPendingImages();
  });
}

elements.printButton.addEventListener('click', () => window.print());
elements.entryForm.addEventListener('submit', addItem);
elements.entryImages.addEventListener('change', (event) => handleImages(event.target.files));
[elements.clientName, elements.projectName, elements.period].forEach((input) => {
  input.addEventListener('input', renderReportHeader);
});

elements.pendingImages.addEventListener('click', (event) => {
  const button = event.target.closest('[data-image-index]');
  if (!button) return;

  state.pendingImages.splice(Number(button.dataset.imageIndex), 1);
  renderPendingImages();
});

elements.timeline.addEventListener('click', (event) => {
  const button = event.target.closest('[data-item-id]');
  if (!button) return;

  state.items = state.items.filter((item) => item.id !== button.dataset.itemId);
  renderReport();
});

renderReportHeader();
renderReport();
