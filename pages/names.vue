<template>
  <div class="names-page">
    <h1 class="names-page__title">이름 목록 관리</h1>

    <div class="names-container">
      <div class="name-input-section">
        <h2 class="name-input-section__title">새 이름 추가</h2>
        <div class="name-input-section__form">
          <input
            v-model="newName"
            placeholder="새 이름 입력"
            class="name-input-section__input"
            @keyup.enter="addNewName"
          />
          <button @click="addNewName" class="name-input-section__button">
            추가
          </button>
        </div>
      </div>

      <div class="name-list-section">
        <h2 class="name-list-section__title">이름 목록</h2>

        <div v-if="namesList.length === 0" class="name-list-section__empty">
          아직 추가된 이름이 없습니다.
        </div>

        <div v-else class="name-list-section__list">
          <div
            v-for="(name, index) in namesList"
            :key="name.id"
            class="name-list-section__item"
            :class="{
              'name-list-section__item--dragging': draggingIndex === index,
            }"
            draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragend="onDragEnd"
            @dragover.prevent
            @dragenter="onDragEnter(index)"
            @drop="onDrop(index)"
          >
            <div class="name-list-section__drag-handle">↕️</div>
            <span class="name-list-section__item-text">{{ name.name }}</span>
            <button
              @click="removeNameItem(name.id)"
              class="name-list-section__remove-button"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      <div class="name-actions-section">
        <h2 class="name-actions-section__title">가져오기 / 내보내기</h2>
        <div class="name-actions-section__buttons">
          <button @click="exportNamesList" class="name-actions-section__button">
            이름 목록 내보내기
          </button>
          <input
            type="file"
            ref="namesFileInput"
            style="display: none"
            @change="importNamesList"
          />
          <button
            @click="$refs.namesFileInput.click()"
            class="name-actions-section__button"
          >
            이름 목록 가져오기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNames } from '~/composables/useNames';

// 이름 목록 관리
const {
  names: namesList,
  addName,
  removeName,
  moveName,
  exportNames,
  importNames,
} = useNames();

// 상태 변수
const newName = ref('');
const namesFileInput = ref<HTMLInputElement | null>(null);
const draggingIndex = ref<number | null>(null);

// 새 이름 추가
function addNewName() {
  if (!newName.value.trim()) return;
  addName(newName.value.trim());
  newName.value = '';
}

// 이름 삭제 (확인 추가)
function removeNameItem(id: string) {
  const nameToRemove = namesList.value.find((n) => n.id === id);
  if (!nameToRemove) return;

  if (confirm(`정말 "${nameToRemove.name}"을(를) 삭제하시겠습니까?`)) {
    removeName(id);
  }
}

// 이름 목록 내보내기
function exportNamesList() {
  const json = exportNames();
  downloadJson(json, 'names.json');
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

// 이름 목록 가져오기
function importNamesList(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content) {
      importNames(content);
      alert('이름 목록을 성공적으로 가져왔습니다.');
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

  // 이름 순서 변경
  moveName(draggingIndex.value, index);

  // 드래그 상태 초기화
  draggingIndex.value = null;
}
</script>

<style scoped>
.names-page {
  padding: 1rem;
}

.names-page__title {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.names-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.name-input-section,
.name-list-section,
.name-actions-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.name-input-section__title,
.name-list-section__title,
.name-actions-section__title {
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.name-input-section__form {
  display: flex;
}

.name-input-section__input {
  flex: 1;
  padding: 0.7rem;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
}

.name-input-section__button {
  padding: 0.7rem 1.5rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.name-input-section__button:hover {
  background-color: #1e2b37;
}

.name-list-section__empty {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.name-list-section__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.8rem;
}

.name-list-section__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  padding: 0.8rem 1rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.name-list-section__item:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.name-list-section__item--dragging {
  opacity: 0.6;
  background-color: #e7f4ff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.name-list-section__drag-handle {
  margin-right: 10px;
  cursor: grab;
  font-size: 1rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.name-list-section__item-text {
  font-weight: 500;
  flex: 1;
}

.name-list-section__remove-button {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.name-list-section__remove-button:hover {
  background-color: #c82333;
}

.name-actions-section__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.name-actions-section__button {
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

.name-actions-section__button:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .names-container {
    grid-template-columns: 1fr 1fr;
  }

  .name-input-section {
    grid-column: 1;
    grid-row: 1;
  }

  .name-list-section {
    grid-column: 1 / span 2;
    grid-row: 2;
  }

  .name-actions-section {
    grid-column: 2;
    grid-row: 1;
  }
}

@media (min-width: 1200px) {
  .name-list-section__list {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

/* 모바일 반응형 스타일 */
@media (max-width: 767px) {
  .names-page {
    padding: 0.5rem;
  }

  .names-page__title {
    font-size: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }

  .names-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .name-input-section,
  .name-list-section,
  .name-actions-section {
    padding: 1rem;
  }

  .name-input-section__form {
    flex-direction: column;
  }

  .name-input-section__input {
    border-radius: 4px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .name-input-section__button {
    border-radius: 4px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    width: 100%;
  }

  .name-list-section__list {
    grid-template-columns: repeat(auto-fill, minmax(100%, 1fr));
  }

  .name-actions-section__buttons {
    flex-direction: column;
  }

  .name-actions-section__button {
    min-width: 100%;
  }
}
</style>
