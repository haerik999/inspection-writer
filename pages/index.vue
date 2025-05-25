<template>
  <div class="main-page">
    <h1 class="main-page__title">템플릿 작성</h1>

    <!-- 템플릿 선택 -->
    <div class="template-selector">
      <label for="template-select" class="template-selector__label"
        >템플릿 선택:</label
      >
      <select
        id="template-select"
        v-model="selectedTemplateId"
        class="template-selector__select"
      >
        <option value="">템플릿을 선택하세요</option>
        <option
          v-for="template in templatesList"
          :key="template.id"
          :value="template.id"
        >
          {{ template.name }}
        </option>
      </select>
    </div>

    <!-- 선택된 템플릿이 없을 때 -->
    <div v-if="!selectedTemplateId" class="empty-state">
      <p class="empty-state__message">
        템플릿을 선택하거나, 사이드바의 '템플릿 관리' 메뉴에서 새 템플릿을
        생성하세요.
      </p>
    </div>

    <!-- 선택된 템플릿이 있을 때 -->
    <div v-else class="template-editor">
      <!-- 이름 목록 (좌측으로 이동) -->
      <section class="names-section">
        <h2 class="names-section__title">이름 목록</h2>
        <div class="names-section__list">
          <div
            v-for="name in namesList"
            :key="name.id"
            class="names-section__item"
            :class="{ 'names-section__item--used': isNameInResult(name.name) }"
            draggable="true"
            @dragstart="onDragStart($event, name.name)"
            @click="showNameContextMenu($event, name.name)"
          >
            <span class="names-section__item-text">{{ name.name }}</span>
          </div>
        </div>
      </section>

      <!-- 결과 표시 섹션 -->
      <section class="result-section">
        <h2 class="names-section__title">내용 작성</h2>
        <div class="result-section__content">
          <div class="result-section__preview" ref="previewContainer">
            <template v-for="(part, index) in templateParts" :key="index">
              <span v-if="!part.isPlaceholder">{{ part.text }}</span>
              <div
                v-else
                class="result-section__placeholder"
                :class="{
                  'result-section__placeholder--filled':
                    filledPlaceholders[part.text]?.length > 0,
                }"
                @dragover.prevent
                @drop="onDropToPlaceholder($event, part.text)"
              >
                <div
                  v-if="filledPlaceholders[part.text]?.length"
                  class="result-section__names result-section__names--inline"
                >
                  <div
                    v-for="(name, nameIndex) in filledPlaceholders[part.text]"
                    :key="nameIndex"
                    class="result-section__name-tag"
                  >
                    {{ name }}
                    <button
                      @click.stop="removeNameFromPlaceholder(part.text, name)"
                      class="result-section__name-remove"
                    >
                      X
                    </button>
                  </div>
                </div>
                <span v-else>{{ part.text }}</span>
                <button
                  v-if="filledPlaceholders[part.text]?.length"
                  @click="clearPlaceholder(part.text)"
                  class="result-section__clear-button"
                  title="모든 이름 지우기"
                >
                  X
                </button>
              </div>
            </template>
          </div>
        </div>
      </section>

      <!-- 결과 복사 버튼 -->
      <div class="action-buttons">
        <button @click="copyToClipboard" class="action-button" ref="copyButton">
          결과 복사하기
        </button>
      </div>
    </div>

    <!-- 컨텍스트 메뉴 -->
    <div
      v-if="showContextMenu"
      class="context-menu"
      :style="{
        top: `${contextMenuPosition.y}px`,
        left: `${contextMenuPosition.x}px`,
      }"
    >
      <div class="context-menu__header">
        <strong>{{ selectedNameForMenu }}</strong> 추가할 위치:
      </div>
      <div class="context-menu__list">
        <div
          v-for="placeholder in uniquePlaceholders"
          :key="placeholder"
          class="context-menu__item"
          @click="addNameToPlaceholder(placeholder, selectedNameForMenu)"
        >
          {{ placeholder }}
        </div>
        <div v-if="uniquePlaceholders.length === 0" class="context-menu__empty">
          템플릿에 플레이스홀더가 없습니다.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useTemplates } from '~/composables/useTemplates';
import { useNames } from '~/composables/useNames';
import Clipboard from 'clipboard';
import { usePlaceholders } from '~/composables/usePlaceholders';

// 템플릿 관리
const { templates: templatesList } = useTemplates();

// 이름 목록 관리
const { names: namesList } = useNames();

// 플레이스홀더 데이터 관리를 위한 컴포저블 추가
const {
  filledPlaceholders,
  updatePlaceholder,
  clearPlaceholder: clearPlaceholderData,
  removeName: removeNameFromPlaceholderData,
} = usePlaceholders();

// 상태 변수
const selectedTemplateId = ref('');
const copyButton = ref<HTMLButtonElement | null>(null);
const previewContainer = ref<HTMLDivElement | null>(null);

// 컨텍스트 메뉴 관련 상태
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const selectedNameForMenu = ref('');

// 선택된 템플릿
const selectedTemplate = computed(() => {
  if (!selectedTemplateId.value) return null;
  return (
    templatesList.value.find((t) => t.id === selectedTemplateId.value) || null
  );
});

// 템플릿 내용
const currentTemplateContent = computed(() => {
  return selectedTemplate.value?.content || '';
});

// 템플릿 파싱하여 일반 텍스트와 플레이스홀더로 나누기
const templateParts = computed(() => {
  const parts: { text: string; isPlaceholder: boolean }[] = [];

  if (!currentTemplateContent.value) return parts;

  // 이스케이프된 중괄호를 임시 토큰으로 변환
  let processedContent = currentTemplateContent.value
    .replace(/\\\{/g, '@@ESCAPED_OPEN_BRACE@@')
    .replace(/\\\}/g, '@@ESCAPED_CLOSE_BRACE@@');

  // {내용} 패턴 찾기 - 모든 중괄호 내용을 플레이스홀더로 취급
  const regex = /(\{[^{}]+\})/g;
  const segments = processedContent.split(regex);

  segments.forEach((segment) => {
    // 임시 토큰을 원래 이스케이프된 중괄호로 복원
    const restoredSegment = segment
      .replace(/@@ESCAPED_OPEN_BRACE@@/g, '{')
      .replace(/@@ESCAPED_CLOSE_BRACE@@/g, '}');

    // 플레이스홀더인지 확인 (중괄호로 감싸진 패턴)
    const isPlaceholder = /^\{[^{}]+\}$/.test(segment);
    parts.push({ text: restoredSegment, isPlaceholder });

    // 플레이스홀더가 처음 발견되면 빈 배열로 초기화
    if (isPlaceholder && !filledPlaceholders.value[restoredSegment]) {
      filledPlaceholders.value[restoredSegment] = [];
    }
  });

  return parts;
});

// 고유한 플레이스홀더 목록
const uniquePlaceholders = computed(() => {
  const placeholders = templateParts.value
    .filter((part) => part.isPlaceholder)
    .map((part) => part.text);

  // 중복 제거
  return [...new Set(placeholders)];
});

// 이름이 결과에 사용되었는지 확인
function isNameInResult(name: string): boolean {
  return Object.values(filledPlaceholders.value).some((nameArr) =>
    nameArr.includes(name)
  );
}

// 드래그 시작
function onDragStart(event: DragEvent, name: string) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', name);
    event.dataTransfer.effectAllowed = 'copy';
  }
}

// 플레이스홀더에 드롭
function onDropToPlaceholder(event: DragEvent, placeholder: string) {
  event.preventDefault();
  if (!event.dataTransfer) return;

  const name = event.dataTransfer.getData('text/plain');

  // 이미 다른 플레이스홀더에 있는지 확인
  const isSuccess = updatePlaceholder(placeholder, name);

  if (!isSuccess) {
    // 이미 다른 플레이스홀더에 있는 경우
    const isAlreadyUsed = Object.entries(filledPlaceholders.value).some(
      ([key, names]) => key !== placeholder && names.includes(name)
    );

    if (isAlreadyUsed) {
      alert(
        `"${name}"은(는) 이미 다른 플레이스홀더에 배치되어 있습니다. 각 이름은 하나의 위치에만 배치할 수 있습니다.`
      );
    } else {
      alert(`"${name}"은(는) 이미 이 위치에 추가되어 있습니다.`);
    }
  }
}

// 특정 플레이스홀더에서 특정 이름 제거
function removeNameFromPlaceholder(placeholder: string, name: string) {
  removeNameFromPlaceholderData(placeholder, name);
}

// 플레이스홀더 비우기
function clearPlaceholder(placeholder: string) {
  clearPlaceholderData(placeholder);
}

// 템플릿 선택 시 내용 업데이트
function onTemplateSelected() {
  if (selectedTemplateId.value && selectedTemplate.value) {
    console.log('템플릿 변경:', selectedTemplate.value.name);
    // 플레이스홀더 초기화
    initializePlaceholders();
  }
}

// 플레이스홀더 초기화
function initializePlaceholders() {
  // 템플릿에서 플레이스홀더 추출
  const placeholders = uniquePlaceholders.value;

  // usePlaceholders 컴포저블의 초기화 함수 직접 호출
  const { initializePlaceholders: initPlaceholders } = usePlaceholders();
  initPlaceholders(placeholders);
}

// 결과 복사
function copyToClipboard() {
  // 플레이스홀더가 채워진 최종 결과 생성
  const finalResult = templateParts.value
    .map((part) => {
      if (!part.isPlaceholder) {
        return part.text;
      } else {
        return filledPlaceholders.value[part.text]?.join(', ') || part.text;
      }
    })
    .join('');

  const clipboard = new Clipboard(copyButton.value as Element, {
    text: function () {
      return finalResult;
    },
  });

  clipboard.on('success', function () {
    alert('복사되었습니다!');
    clipboard.destroy();
  });

  clipboard.on('error', function () {
    alert('복사 실패. 다시 시도해주세요.');
    clipboard.destroy();
  });

  (copyButton.value as HTMLButtonElement).click();
}

// 컨텍스트 메뉴 표시
function showNameContextMenu(event: MouseEvent, name: string) {
  event.preventDefault();
  event.stopPropagation();

  // 이미 메뉴가 열려있으면 닫기
  if (showContextMenu.value && selectedNameForMenu.value === name) {
    hideContextMenu();
    return;
  }

  // 메뉴 위치 설정
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY,
  };

  selectedNameForMenu.value = name;
  showContextMenu.value = true;

  // 메뉴 외부 클릭 시 닫기 위한 이벤트 리스너 추가
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu);
  }, 0);
}

// 컨텍스트 메뉴 숨기기
function hideContextMenu() {
  showContextMenu.value = false;
  document.removeEventListener('click', hideContextMenu);
}

// 컨텍스트 메뉴에서 플레이스홀더 선택
function addNameToPlaceholder(placeholder: string, name: string) {
  const isSuccess = updatePlaceholder(placeholder, name);

  if (!isSuccess) {
    // 이미 다른 플레이스홀더에 있는 경우
    const isAlreadyUsed = Object.entries(filledPlaceholders.value).some(
      ([key, names]) => key !== placeholder && names.includes(name)
    );

    if (isAlreadyUsed) {
      alert(
        `"${name}"은(는) 이미 다른 플레이스홀더에 배치되어 있습니다. 각 이름은 하나의 위치에만 배치할 수 있습니다.`
      );
    } else {
      alert(`"${name}"은(는) 이미 이 위치에 추가되어 있습니다.`);
    }
  }

  hideContextMenu();
}

// 선택된 템플릿 변경 감시
watch(selectedTemplateId, onTemplateSelected);

// 컴포넌트 마운트 시 실행
onMounted(() => {
  // 기본 템플릿이 있으면 첫 번째 템플릿 선택
  if (templatesList.value.length > 0) {
    selectedTemplateId.value = templatesList.value[0].id;
  }
});

// 컴포넌트 해제 시 이벤트 리스너 제거
onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu);
});
</script>

<style scoped>
.main-page {
  padding: 1rem;
}

.main-page__title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.template-selector {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.template-selector__label {
  margin-right: 1rem;
  font-weight: bold;
}

.template-selector__select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 250px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 2rem 0;
}

.empty-state__message {
  color: #6c757d;
  font-size: 1.1rem;
  text-align: center;
}

.template-editor {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto auto;
  gap: 1.5rem;
}

.result-section {
  grid-row: 2;
}

.names-section {
  grid-row: 1;
}

.placements-section {
  grid-row: 3;
}

.action-buttons {
  grid-row: 4;
  display: flex;
  justify-content: flex-end;
}

.names-section__title,
.placements-section__title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.names-section__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: white;
  max-height: 300px;
  overflow-y: auto;
}

.names-section__item {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s;
}

.names-section__item:hover {
  background-color: #e0e0e0;
}

.names-section__item--used {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

.names-section__item-text {
  margin-right: 0.5rem;
}

.placements-section__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 4px;
}

.placements-section__item {
  padding: 0.8rem;
  border-bottom: 1px solid #eee;
}

.action-button {
  padding: 0.7rem 1.5rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #218838;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 결과 섹션 스타일 */
.result-section__content {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1.5rem;
  min-height: 200px;
  white-space: pre-wrap;
  overflow-x: auto;
}

.result-section__preview {
  line-height: 1.8;
}

.result-section__placeholder {
  display: inline-flex;
  background-color: #f0f0f0;
  padding: 1rem 1.2rem;
  border: 2px dashed #aaa;
  border-radius: 8px;
  margin: 0.5rem;
  position: relative;
  min-width: 300px;
  min-height: 80px;
  transition: all 0.2s;
  vertical-align: middle;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}

.result-section__placeholder:hover {
  background-color: #e8e8e8;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.result-section__placeholder--filled {
  background-color: #d4edda;
  border: 2px solid #c3e6cb;
  justify-content: flex-start;
  align-items: flex-start;
  text-align: left;
  padding: 0.2rem 0.3rem;
}

.result-section__clear-button {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #dc3545;
  color: white;
  border: none;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.result-section__clear-button:hover {
  background-color: #c82333;
  transform: scale(1.1);
}

.result-section__names {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.result-section__names--inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  width: 100%;
  padding: 0.3rem;
}

.result-section__name-tag {
  display: inline-flex;
  align-items: center;
  background-color: #e7f4ff;
  border: 1px solid #b8daff;
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-size: 0.95rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.result-section__name-tag:hover {
  background-color: #d2ebff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.result-section__name-remove {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 0.85rem;
  cursor: pointer;
  margin-left: 0.5rem;
  padding: 0 0.3rem;
  transition: all 0.2s;
}

.result-section__name-remove:hover {
  color: #bd2130;
  transform: scale(1.2);
}

.result-section__empty {
  color: #6c757d;
  font-style: italic;
}

/* 컨텍스트 메뉴 스타일 */
.context-menu {
  position: fixed;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 200px;
  max-width: 300px;
  overflow: hidden;
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.context-menu__header {
  padding: 0.8rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  font-size: 0.9rem;
}

.context-menu__list {
  max-height: 300px;
  overflow-y: auto;
}

.context-menu__item {
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.context-menu__item:hover {
  background-color: #e7f4ff;
}

.context-menu__empty {
  padding: 0.8rem;
  color: #6c757d;
  font-style: italic;
  text-align: center;
}

@media (min-width: 768px) {
  .template-editor {
    grid-template-columns: 300px 1fr;
    grid-template-rows: auto auto auto;
  }

  .names-section {
    grid-column: 1;
    grid-row: 1 / span 2;
  }

  .result-section {
    grid-column: 2;
    grid-row: 1;
  }

  .placements-section {
    grid-column: 2;
    grid-row: 2;
  }

  .action-buttons {
    grid-column: 1 / span 2;
    grid-row: 3;
  }

  .names-section__list {
    flex-direction: column;
    max-height: 600px;
  }

  .names-section__item {
    width: 100%;
  }
}

@media (min-width: 1200px) {
  .template-editor {
    grid-template-columns: 300px 1fr;
  }
}

/* 모바일 반응형 스타일 */
@media (max-width: 767px) {
  .main-page {
    padding: 0.5rem;
  }

  .main-page__title {
    font-size: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }

  .template-selector {
    flex-direction: column;
    align-items: flex-start;
  }

  .template-selector__label {
    margin-bottom: 0.5rem;
  }

  .template-selector__select {
    width: 100%;
  }

  .template-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .names-section__list {
    max-height: 200px;
    overflow-y: auto;
    flex-wrap: wrap;
    flex-direction: row;
  }

  .names-section__item {
    width: auto;
  }

  .result-section__content {
    padding: 1rem;
  }

  .result-section__placeholder {
    min-width: 200px;
    min-height: 60px;
    padding: 0.8rem 1rem;
    margin: 0.3rem;
  }

  .action-buttons {
    margin-top: 1rem;
  }

  /* 컨텍스트 메뉴 모바일 조정 */
  .context-menu {
    max-width: 90%;
    width: 90%;
  }
}
</style>
