import { ref } from 'vue';
import type { FilledPlaceholder } from '~/types';

// 싱글톤으로 관리할 전역 상태
const filledPlaceholders = ref<FilledPlaceholder>({});

export function usePlaceholders() {
  // 플레이스홀더에 이름 추가
  function updatePlaceholder(placeholder: string, name: string): boolean {
    // 플레이스홀더가 초기화되지 않은 경우 초기화
    if (!filledPlaceholders.value[placeholder]) {
      filledPlaceholders.value[placeholder] = [];
    }

    // 이미 다른 플레이스홀더에 있는지 확인
    const isAlreadyUsed = Object.entries(filledPlaceholders.value).some(
      ([key, names]) => key !== placeholder && names.includes(name)
    );

    // 이미 같은 플레이스홀더에 있는지 확인
    const isAlreadyInSamePlaceholder =
      filledPlaceholders.value[placeholder].includes(name);

    // 다른 플레이스홀더에 있거나 같은 플레이스홀더에 이미 있으면 추가하지 않음
    if (isAlreadyUsed) {
      return false;
    }

    if (isAlreadyInSamePlaceholder) {
      return false;
    }

    // 플레이스홀더에 이름 추가
    filledPlaceholders.value[placeholder].push(name);
    return true;
  }

  // 특정 플레이스홀더에서 특정 이름 제거
  function removeName(placeholder: string, name: string): void {
    if (!filledPlaceholders.value[placeholder]) return;

    const index = filledPlaceholders.value[placeholder].indexOf(name);
    if (index !== -1) {
      filledPlaceholders.value[placeholder].splice(index, 1);
    }
  }

  // 플레이스홀더 비우기
  function clearPlaceholder(placeholder: string): void {
    if (filledPlaceholders.value[placeholder]) {
      filledPlaceholders.value[placeholder] = [];
    }
  }

  // 모든 플레이스홀더 초기화
  function initializePlaceholders(placeholders: string[]): void {
    // 템플릿 변경 시 모든 플레이스홀더 데이터를 초기화
    const newPlaceholders: FilledPlaceholder = {};

    // 모든 플레이스홀더를 빈 배열로 초기화 (기존 값 유지하지 않음)
    placeholders.forEach((placeholder) => {
      newPlaceholders[placeholder] = [];
    });

    // 새 플레이스홀더 목록으로 업데이트
    filledPlaceholders.value = newPlaceholders;
  }

  // 플레이스홀더 데이터 내보내기
  function exportPlaceholders(): string {
    return JSON.stringify(filledPlaceholders.value);
  }

  // 플레이스홀더 데이터 가져오기
  function importPlaceholders(json: string): void {
    try {
      const data = JSON.parse(json);
      if (data && typeof data === 'object') {
        filledPlaceholders.value = data;
      }
    } catch (error) {
      console.error('플레이스홀더 데이터 가져오기 실패:', error);
    }
  }

  // 이름이 어떤 플레이스홀더에서든 사용되었는지 확인
  function isNameUsed(name: string): boolean {
    return Object.values(filledPlaceholders.value).some((names) =>
      names.includes(name)
    );
  }

  return {
    filledPlaceholders,
    updatePlaceholder,
    removeName,
    clearPlaceholder,
    initializePlaceholders,
    exportPlaceholders,
    importPlaceholders,
    isNameUsed,
  };
}
