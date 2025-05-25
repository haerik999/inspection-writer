<template>
  <!-- 모바일 햄버거 메뉴 버튼 -->
  <div class="mobile-header">
    <button @click="toggleMobileSidebar" class="mobile-header__menu-button">
      <span class="mobile-header__menu-icon">☰</span>
    </button>
    <h1 class="mobile-header__title">템플릿 작성기</h1>
  </div>

  <!-- 모바일 오버레이 -->
  <div
    v-if="isMobileMenuOpen"
    class="sidebar-overlay"
    @click="closeMobileMenu"
  ></div>

  <!-- 사이드바 -->
  <div
    class="sidebar"
    :class="{
      'sidebar--collapsed': isCollapsed && !isMobile,
      'sidebar--mobile': isMobile,
      'sidebar--mobile-open': isMobileMenuOpen,
    }"
  >
    <div class="sidebar__header">
      <h1 class="sidebar__title">템플릿 작성기</h1>
      <button v-if="!isMobile" @click="toggleSidebar" class="sidebar__toggle">
        {{ isCollapsed ? '〉' : '〈' }}
      </button>
      <button v-else @click="closeMobileMenu" class="sidebar__close">✕</button>
    </div>

    <nav class="sidebar__nav">
      <ul class="sidebar__menu">
        <li class="sidebar__menu-item">
          <NuxtLink
            to="/"
            class="sidebar__menu-link"
            active-class="sidebar__menu-link--active"
            exact
            @click="isMobile && closeMobileMenu()"
          >
            <span class="sidebar__menu-icon">📄</span>
            <span class="sidebar__menu-text">템플릿 작성</span>
          </NuxtLink>
        </li>

        <li class="sidebar__menu-item">
          <NuxtLink
            to="/templates"
            class="sidebar__menu-link"
            active-class="sidebar__menu-link--active"
            @click="isMobile && closeMobileMenu()"
          >
            <span class="sidebar__menu-icon">📝</span>
            <span class="sidebar__menu-text">템플릿 관리</span>
          </NuxtLink>
        </li>

        <li class="sidebar__menu-item">
          <NuxtLink
            to="/names"
            class="sidebar__menu-link"
            active-class="sidebar__menu-link--active"
            @click="isMobile && closeMobileMenu()"
          >
            <span class="sidebar__menu-icon">👤</span>
            <span class="sidebar__menu-text">이름 목록 관리</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="sidebar__export-section">
      <h2 class="sidebar__section-title">데이터 관리</h2>
      <div class="sidebar__export-buttons">
        <button @click="exportAll" class="sidebar__export-button">
          <span class="sidebar__button-icon">⬇️</span>
          <span class="sidebar__button-text">모든 데이터 내보내기</span>
        </button>

        <input
          type="file"
          ref="allDataFileInput"
          style="display: none"
          @change="importAll"
        />
        <button
          @click="$refs.allDataFileInput.click()"
          class="sidebar__export-button"
        >
          <span class="sidebar__button-icon">⬆️</span>
          <span class="sidebar__button-text">모든 데이터 가져오기</span>
        </button>
      </div>
    </div>

    <div class="sidebar__footer">
      <p class="sidebar__footer-text">© 2025 템플릿 작성기</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTemplates } from '~/composables/useTemplates';
import { useNames } from '~/composables/useNames';
import { usePlaceholders } from '~/composables/usePlaceholders';

// 템플릿 및 이름 관리
const {
  templates: templatesList,
  exportTemplates,
  importTemplates,
} = useTemplates();
const { names: namesList, exportNames, importNames } = useNames();
const { filledPlaceholders, exportPlaceholders, importPlaceholders } =
  usePlaceholders();

// 상태 변수
const isCollapsed = ref(false);
const isMobile = ref(false);
const isMobileMenuOpen = ref(false);
const allDataFileInput = ref<HTMLInputElement | null>(null);

// 화면 크기에 따라 모바일 여부 설정
function checkMobile() {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) {
    isMobileMenuOpen.value = false;
  }
}

// 모바일 메뉴 열기/닫기
function toggleMobileSidebar() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  // 메뉴가 열리면 body의 스크롤 방지
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// 모바일 메뉴 닫기
function closeMobileMenu() {
  isMobileMenuOpen.value = false;
  document.body.style.overflow = '';
}

// 사이드바 토글 (PC 전용)
function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
}

// 모든 데이터 내보내기
function exportAll() {
  if (!confirm('모든 데이터를 내보내시겠습니까?')) {
    return;
  }

  // 파일 이름 입력 받기
  const defaultFileName = 'report-data.json';
  const fileName = prompt(
    '저장할 파일 이름을 입력하세요 (확장자 포함)',
    defaultFileName
  );

  if (!fileName) return; // 취소 시 종료

  // 템플릿과 이름 데이터 복제
  const templates = JSON.parse(JSON.stringify(templatesList.value));
  const names = JSON.parse(JSON.stringify(namesList.value));

  // 플레이스홀더 데이터도 포함
  const placeholders = JSON.parse(JSON.stringify(filledPlaceholders.value));

  console.log('내보내기 데이터:', {
    templates: templates.length,
    names: names.length,
    placeholders: Object.keys(placeholders).length,
  });

  const data = {
    templates: templates,
    names: names,
    placeholders: placeholders,
  };

  const json = JSON.stringify(data, null, 2); // 들여쓰기 추가하여 가독성 향상
  downloadJson(json, fileName);

  // 다운로드 완료 알림
  alert('모든 데이터가 성공적으로 내보내졌습니다.');

  // 모바일인 경우 메뉴 닫기
  if (isMobile.value) {
    closeMobileMenu();
  }
}

// 모든 데이터 가져오기
function importAll(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      if (content) {
        const data = JSON.parse(content);
        console.log('가져온 데이터 구조:', Object.keys(data));

        if (data.templates && Array.isArray(data.templates)) {
          console.log(
            '템플릿 데이터 가져오기 시작:',
            data.templates.length,
            '개'
          );
          importTemplates(JSON.stringify(data.templates));
        } else {
          console.warn('템플릿 데이터가 없거나 형식이 올바르지 않습니다.');
        }

        if (data.names && Array.isArray(data.names)) {
          console.log('이름 데이터 가져오기 시작:', data.names.length, '개');
          importNames(JSON.stringify(data.names));
        } else {
          console.warn('이름 데이터가 없거나 형식이 올바르지 않습니다.');
        }

        if (data.placeholders && typeof data.placeholders === 'object') {
          console.log(
            '플레이스홀더 데이터 가져오기 시작:',
            Object.keys(data.placeholders).length,
            '개'
          );
          importPlaceholders(JSON.stringify(data.placeholders));
        } else {
          console.warn(
            '플레이스홀더 데이터가 없거나 형식이 올바르지 않습니다.'
          );
        }

        alert('모든 데이터를 성공적으로 불러왔습니다.');

        // 모바일인 경우 메뉴 닫기
        if (isMobile.value) {
          closeMobileMenu();
        }
      }
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      alert('데이터 가져오기에 실패했습니다. 파일 형식을 확인해주세요.');
    }
  };

  reader.readAsText(file);
  input.value = ''; // 입력 필드 초기화
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

// 컴포넌트 마운트 시 화면 크기 체크
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

// 컴포넌트 언마운트 시 이벤트 리스너 제거
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped>
/* 모바일 헤더 스타일 */
.mobile-header {
  display: none;
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  height: var(--header-height);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mobile-header__menu-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  margin-right: 1rem;
}

.mobile-header__title {
  font-size: 1.2rem;
  margin: 0;
}

/* 사이드바 오버레이 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

/* 사이드바 기본 스타일 */
.sidebar {
  width: 250px;
  height: 100vh;
  background-color: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.sidebar--collapsed {
  width: 60px;
}

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar__title {
  font-size: 1.2rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar--collapsed .sidebar__title {
  display: none;
}

.sidebar__toggle,
.sidebar__close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.2rem 0.5rem;
  transition: all 0.2s;
}

.sidebar__toggle:hover,
.sidebar__close:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.sidebar__menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar__menu-item {
  margin-bottom: 0.5rem;
}

.sidebar__menu-link {
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  color: #ecf0f1;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.sidebar__menu-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar__menu-link--active {
  background-color: rgba(255, 255, 255, 0.15);
  border-left-color: #3498db;
}

.sidebar__menu-icon {
  margin-right: 0.8rem;
  font-size: 1.2rem;
  min-width: 1.5rem;
  text-align: center;
}

.sidebar--collapsed .sidebar__menu-text {
  display: none;
}

.sidebar__section-title {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #bdc3c7;
  padding: 0 1rem;
  margin: 1rem 0 0.5rem;
}

.sidebar--collapsed .sidebar__section-title {
  display: none;
}

.sidebar__export-section {
  padding: 0 0 1rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar__export-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1rem;
}

.sidebar__export-button {
  display: flex;
  align-items: center;
  padding: 0.7rem;
  background-color: #34495e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.sidebar__export-button:hover {
  background-color: #2c3e50;
}

.sidebar__button-icon {
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

.sidebar--collapsed .sidebar__button-text {
  display: none;
}

.sidebar--collapsed .sidebar__export-button {
  justify-content: center;
}

.sidebar--collapsed .sidebar__button-icon {
  margin-right: 0;
}

.sidebar__footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  color: #bdc3c7;
  text-align: center;
}

.sidebar--collapsed .sidebar__footer-text {
  display: none;
}

/* 모바일 대응 스타일 */
@media (max-width: 768px) {
  /* 모바일 헤더 표시 */
  .mobile-header {
    display: flex;
    align-items: center;
  }

  /* 사이드바 오버레이 표시 */
  .sidebar-overlay {
    display: block;
  }

  /* 모바일 사이드바 스타일 */
  .sidebar--mobile {
    width: 80%; /* 화면의 80% 차지 */
    max-width: 300px;
    left: -100%; /* 초기에는 화면 밖으로 숨김 */
    top: 0;
    height: 100vh;
    z-index: 1001;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
  }

  /* 모바일 사이드바 열림 상태 */
  .sidebar--mobile-open {
    left: 0;
  }

  .sidebar__close {
    display: block;
  }

  /* 항상 모든 텍스트 표시 */
  .sidebar__menu-text,
  .sidebar__section-title,
  .sidebar__button-text,
  .sidebar__footer-text {
    display: block !important;
  }

  /* 버튼 아이콘도 항상 표시 */
  .sidebar__button-icon {
    margin-right: 0.5rem !important;
  }

  /* 내부 요소들의 패딩 조정 */
  .sidebar__nav {
    padding: 0.5rem 0;
  }

  .sidebar__menu-link {
    padding: 0.8rem 1rem;
  }

  .sidebar__footer {
    padding: 0.8rem;
  }
}
</style>
