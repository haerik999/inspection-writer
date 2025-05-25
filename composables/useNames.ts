import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { NameItem } from '~/types';

// 싱글톤으로 만들기 위한 상태 변수
const names = ref<NameItem[]>([]);

export function useNames() {
  // 이름 추가
  function addName(name: string): NameItem {
    const newName: NameItem = {
      id: uuidv4(),
      name,
    };

    names.value.push(newName);
    return newName;
  }

  // 이름 삭제
  function removeName(id: string): void {
    names.value = names.value.filter((n) => n.id !== id);
  }

  // 이름 순서 변경
  function moveName(fromIndex: number, toIndex: number): void {
    // 인덱스 범위 확인
    if (
      fromIndex < 0 ||
      fromIndex >= names.value.length ||
      toIndex < 0 ||
      toIndex >= names.value.length
    ) {
      return;
    }

    // 이동할 항목 저장
    const item = names.value[fromIndex];

    // 원래 배열에서 항목 제거
    names.value.splice(fromIndex, 1);

    // 새 위치에 항목 삽입
    names.value.splice(toIndex, 0, item);
  }

  // 이름 목록 내보내기
  function exportNames(): string {
    return JSON.stringify(names.value);
  }

  // 이름 목록 가져오기
  function importNames(json: string): void {
    try {
      const importedNames = JSON.parse(json);
      if (Array.isArray(importedNames)) {
        names.value = importedNames;
        console.log(
          '이름 목록 가져오기 성공:',
          names.value.length,
          '개의 이름 로드됨'
        );
      }
    } catch (error) {
      console.error('이름 목록 가져오기 실패:', error);
    }
  }

  return {
    names,
    addName,
    removeName,
    moveName,
    exportNames,
    importNames,
  };
}
