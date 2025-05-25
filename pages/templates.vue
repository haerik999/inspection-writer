<template>
  <div class="templates-page">
    <h1 class="templates-page__title">템플릿 관리</h1>

    <div class="templates-container">
      <div class="template-list-section">
        <h2 class="template-list-section__title">템플릿 목록</h2>

        <div
          v-if="templatesList.length === 0"
          class="template-list-section__empty"
        >
          아직 생성된 템플릿이 없습니다.
        </div>

        <div v-else class="template-list-section__list">
          <div
            v-for="(template, index) in templatesList"
            :key="template.id"
            class="template-list-section__item"
            :class="{
              'template-list-section__item--active':
                selectedTemplateId === template.id,
              'template-list-section__item--dragging': draggingIndex === index,
            }"
            @click="selectTemplate(template.id)"
            draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragend="onDragEnd"
            @dragover.prevent
            @dragenter="onDragEnter(index)"
            @drop="onDrop(index)"
          >
            <div class="template-list-section__drag-handle">↕️</div>
            <div class="template-list-section__item-details">
              <h3 class="template-list-section__item-name">
                {{ template.name }}
              </h3>
              <p class="template-list-section__item-preview">
                {{ getTemplatePreview(template.content) }}
              </p>
            </div>
            <div class="template-list-section__item-actions">
              <button
                @click.stop="renameTemplate(template.id)"
                class="template-list-section__item-button"
                title="이름 변경"
              >
                수정
              </button>
              <button
                @click.stop="deleteTemplate(template.id)"
                class="template-list-section__item-button template-list-section__item-button--delete"
                title="템플릿 삭제"
              >
                삭제
              </button>
            </div>
          </div>
        </div>

        <button
          @click="createNewTemplate"
          class="template-list-section__add-button"
        >
          새 템플릿 만들기
        </button>
      </div>

      <div class="template-editor-section">
        <h2 class="template-editor-section__title">
          {{ isNewTemplate ? '새 템플릿 만들기' : '템플릿 편집' }}
        </h2>

        <div v-if="isEditingTemplate" class="template-editor-section__form">
          <div class="template-editor-section__name">
            <label for="template-name" class="template-editor-section__label"
              >템플릿 이름:</label
            >
            <input
              id="template-name"
              v-model="currentTemplateName"
              placeholder="템플릿 이름을 입력하세요"
              class="template-editor-section__name-input"
            />
          </div>

          <div class="template-editor-section__content">
            <label for="template-content" class="template-editor-section__label"
              >템플릿 내용:</label
            >
            <textarea
              id="template-content"
              v-model="currentTemplateContent"
              placeholder="템플릿 내용을 입력하세요. 이름을 넣을 위치에 {텍스트} 형태로 입력하세요. 중괄호 자체를 표시하려면 \{, \}와 같이 이스케이프 처리하세요."
              class="template-editor-section__content-textarea"
            ></textarea>
          </div>

          <div class="template-editor-section__placeholder-help">
            <h3 class="template-editor-section__help-title">
              플레이스홀더 사용법
            </h3>
            <ul class="template-editor-section__help-list">
              <li>
                이름을 넣을 위치에 <code>{이름}</code> 형태로 중괄호 안에
                텍스트를 입력하세요.
              </li>
              <li>
                여러 종류의 플레이스홀더를 사용할 수 있습니다:
                <code>{이름1}</code>, <code>{직원}</code>,
                <code>{사원}</code> 등
              </li>
              <li>
                중괄호 자체를 표시하려면 <code>\{</code>와 <code>\}</code>로
                이스케이프 처리하세요.
              </li>
            </ul>
          </div>

          <div class="template-editor-section__actions">
            <button
              @click="saveTemplate"
              class="template-editor-section__save-button"
            >
              저장
            </button>
            <button
              @click="cancelEditing"
              class="template-editor-section__cancel-button"
            >
              취소
            </button>
          </div>
        </div>

        <div
          v-else-if="selectedTemplate"
          class="template-editor-section__preview"
        >
          <div class="template-editor-section__preview-content">
            <pre>{{ selectedTemplate.content }}</pre>
          </div>
          <button
            @click="editCurrentTemplate"
            class="template-editor-section__edit-button"
          >
            편집하기
          </button>
        </div>

        <div v-else class="template-editor-section__empty">
          왼쪽 목록에서 템플릿을 선택하거나 새로 만들어주세요.
        </div>
      </div>

      <div class="template-actions-section">
        <h2 class="template-actions-section__title">가져오기 / 내보내기</h2>
        <div class="template-actions-section__buttons">
          <button
            @click="exportTemplatesList"
            class="template-actions-section__button"
          >
            템플릿 내보내기
          </button>
          <input
            type="file"
            ref="templatesFileInput"
            style="display: none"
            @change="importTemplatesList"
          />
          <button
            @click="$refs.templatesFileInput.click()"
            class="template-actions-section__button"
          >
            템플릿 가져오기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTemplates } from '~/composables/useTemplates';

// 템플릿 관리
const {
  templates: templatesList,
  addTemplate,
  updateTemplate,
  removeTemplate,
  exportTemplates,
  importTemplates,
  moveTemplate,
} = useTemplates();

// 상태 변수
const selectedTemplateId = ref('');
const isNewTemplate = ref(false);
const isEditingTemplate = ref(false);
const currentTemplateName = ref('');
const currentTemplateContent = ref('');
const templatesFileInput = ref<HTMLInputElement | null>(null);
const draggingIndex = ref<number | null>(null);

// 선택된 템플릿
const selectedTemplate = computed(() => {
  if (!selectedTemplateId.value) return null;
  return (
    templatesList.value.find((t) => t.id === selectedTemplateId.value) || null
  );
});

// 템플릿 미리보기 텍스트 생성 (최대 50자로 줄임)
function getTemplatePreview(content: string): string {
  if (!content) return '';
  return content.length > 50 ? content.substring(0, 50) + '...' : content;
}

// 템플릿 선택
function selectTemplate(id: string) {
  selectedTemplateId.value = id;
  isNewTemplate.value = false;
  isEditingTemplate.value = false;
}

// 새 템플릿 만들기
function createNewTemplate() {
  selectedTemplateId.value = '';
  isNewTemplate.value = true;
  isEditingTemplate.value = true;
  currentTemplateName.value = '';
  currentTemplateContent.value = '';
}

// 현재 템플릿 편집
function editCurrentTemplate() {
  if (!selectedTemplate.value) return;

  isEditingTemplate.value = true;
  currentTemplateName.value = selectedTemplate.value.name;
  currentTemplateContent.value = selectedTemplate.value.content;
}

// 템플릿 저장
function saveTemplate() {
  if (!currentTemplateName.value.trim()) {
    alert('템플릿 이름을 입력해주세요.');
    return;
  }

  if (isNewTemplate.value) {
    // 새 템플릿 추가
    const newTemplate = addTemplate(
      currentTemplateName.value,
      currentTemplateContent.value
    );
    selectedTemplateId.value = newTemplate.id;
  } else {
    // 기존 템플릿 업데이트
    updateTemplate(
      selectedTemplateId.value,
      currentTemplateName.value,
      currentTemplateContent.value
    );
  }

  isNewTemplate.value = false;
  isEditingTemplate.value = false;
}

// 편집 취소
function cancelEditing() {
  isEditingTemplate.value = false;
  if (isNewTemplate.value) {
    isNewTemplate.value = false;
    selectedTemplateId.value =
      templatesList.value.length > 0 ? templatesList.value[0].id : '';
  }
}

// 템플릿 이름 변경
function renameTemplate(id: string) {
  const template = templatesList.value.find((t) => t.id === id);
  if (!template) return;

  const newName = prompt('새 템플릿 이름을 입력하세요:', template.name);
  if (newName && newName.trim()) {
    updateTemplate(id, newName.trim(), template.content);
  }
}

// 템플릿 삭제
function deleteTemplate(id: string) {
  const template = templatesList.value.find((t) => t.id === id);
  if (!template) return;

  if (confirm(`정말 "${template.name}" 템플릿을 삭제하시겠습니까?`)) {
    removeTemplate(id);

    if (selectedTemplateId.value === id) {
      selectedTemplateId.value =
        templatesList.value.length > 0 ? templatesList.value[0].id : '';
      isEditingTemplate.value = false;
    }
  }
}

// 템플릿 목록 내보내기
function exportTemplatesList() {
  const json = exportTemplates();
  downloadJson(json, 'templates.json');
}

// JSON 다운로드
function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 템플릿 목록 가져오기
function importTemplatesList(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content) {
      importTemplates(content);
      alert('템플릿을 성공적으로 가져왔습니다.');

      if (templatesList.value.length > 0) {
        selectedTemplateId.value = templatesList.value[0].id;
      }
    }
  };

  reader.readAsText(file);
  input.value = ''; // 입력 필드 초기화
}

// 드래그 시작
function onDragStart(event: DragEvent, index: number) {
  draggingIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  }
}

// 드래그 종료
function onDragEnd() {
  draggingIndex.value = null;
}

// 드래그 엔터
function onDragEnter(index: number) {
  // 자기 자신에 드래그하는 경우는 무시
  if (draggingIndex.value === index) return;

  // 드래그 위치 표시를 위해 필요할 경우 여기에 코드 추가
}

// 드롭 처리
function onDrop(index: number) {
  // 자기 자신에 드롭하는 경우는 무시
  if (draggingIndex.value === index || draggingIndex.value === null) return;

  // 템플릿 순서 변경
  moveTemplate(draggingIndex.value, index);

  // 드래그 상태 초기화
  draggingIndex.value = null;
}
</script>

<style scoped>
.templates-page {
  padding: 1rem;
}

.templates-page__title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.templates-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.template-list-section,
.template-editor-section,
.template-actions-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.template-list-section__title,
.template-editor-section__title,
.template-actions-section__title {
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.template-list-section__empty,
.template-editor-section__empty {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.template-list-section__list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.template-list-section__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-list-section__item:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.template-list-section__item--active {
  background-color: #e7f4ff;
  border-left: 4px solid #0d6efd;
}

.template-list-section__item--dragging {
  opacity: 0.6;
  background-color: #e7f4ff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.template-list-section__item-details {
  flex: 1;
  min-width: 0; /* 필수: flex 항목의 오버플로우 컨트롤을 위함 */
  overflow: hidden; /* 내용이 넘치지 않도록 함 */
  margin-right: 1rem; /* 버튼과의 간격 확보 */
}

.template-list-section__item-name {
  font-size: 1.1rem;
  margin: 0 0 0.3rem 0;
  color: #212529;
}

.template-list-section__item-preview {
  margin: 0;
  font-size: 0.9rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; /* 부모 컨테이너 너비를 넘지 않도록 설정 */
  width: 100%; /* 너비를 채우도록 설정 */
}

.template-list-section__item-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0; /* 중요: 버튼 영역이 축소되지 않도록 설정 */
}

.template-list-section__item-button {
  padding: 0.4rem 0.8rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.template-list-section__item-button:hover {
  background-color: #5a6268;
}

.template-list-section__item-button--delete {
  background-color: #dc3545;
}

.template-list-section__item-button--delete:hover {
  background-color: #c82333;
}

.template-list-section__add-button {
  width: 100%;
  padding: 0.8rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.template-list-section__add-button:hover {
  background-color: #218838;
}

.template-editor-section__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.template-editor-section__name,
.template-editor-section__content {
  display: flex;
  flex-direction: column;
}

.template-editor-section__label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.template-editor-section__name-input {
  padding: 0.7rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.template-editor-section__content-textarea {
  width: 100%;
  height: 300px;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 1rem;
  resize: vertical;
  line-height: 1.5;
}

.template-editor-section__placeholder-help {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1rem;
}

.template-editor-section__help-title {
  font-size: 1rem;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.template-editor-section__help-list {
  margin: 0;
  padding-left: 1.5rem;
}

.template-editor-section__help-list li {
  margin-bottom: 0.5rem;
}

.template-editor-section__help-list code {
  background-color: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
}

.template-editor-section__actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.template-editor-section__save-button,
.template-editor-section__edit-button {
  padding: 0.7rem 1.5rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.template-editor-section__save-button:hover,
.template-editor-section__edit-button:hover {
  background-color: #218838;
}

.template-editor-section__cancel-button {
  padding: 0.7rem 1.5rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.template-editor-section__cancel-button:hover {
  background-color: #5a6268;
}

.template-editor-section__preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.template-editor-section__preview-content {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  min-height: 200px;
  overflow-x: auto;
}

.template-editor-section__preview-content pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: monospace;
  line-height: 1.5;
}

.template-actions-section__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.template-actions-section__button {
  flex: 1;
  padding: 0.8rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
  min-width: 200px;
}

.template-actions-section__button:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.template-list-section__drag-handle {
  margin-right: 10px;
  cursor: grab;
  font-size: 1rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 768px) {
  .templates-container {
    grid-template-columns: 350px 1fr;
    grid-template-rows: auto auto;
  }

  .template-list-section {
    grid-column: 1;
    grid-row: 1 / span 2;
  }

  .template-editor-section {
    grid-column: 2;
    grid-row: 1;
  }

  .template-actions-section {
    grid-column: 2;
    grid-row: 2;
  }
}

@media (min-width: 1200px) {
  .templates-container {
    grid-template-columns: 400px 1fr;
  }
}

/* 모바일 반응형 스타일 */
@media (max-width: 767px) {
  .templates-page {
    padding: 0.5rem;
  }

  .templates-page__title {
    font-size: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }

  .templates-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .template-list-section,
  .template-editor-section,
  .template-actions-section {
    padding: 1rem;
  }

  .template-list-section__item {
    padding: 0.8rem;
  }

  .template-editor-section__content-textarea {
    height: 250px;
  }

  .template-editor-section__actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .template-editor-section__save-button,
  .template-editor-section__cancel-button,
  .template-editor-section__edit-button {
    width: 100%;
  }

  .template-actions-section__buttons {
    flex-direction: column;
  }

  .template-actions-section__button {
    min-width: 100%;
  }
}
</style>
