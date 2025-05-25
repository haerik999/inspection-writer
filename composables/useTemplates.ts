import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { Template } from '~/types';

// 싱글톤으로 만들기 위한 상태 변수
const templates = ref<Template[]>([]);

export function useTemplates() {
  // 템플릿 추가
  function addTemplate(name: string, content: string): Template {
    const newTemplate: Template = {
      id: uuidv4(),
      name,
      content,
      createdAt: new Date().toISOString(),
    };

    templates.value.push(newTemplate);
    return newTemplate;
  }

  // 템플릿 업데이트
  function updateTemplate(id: string, name: string, content: string): void {
    const index = templates.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      templates.value[index] = {
        ...templates.value[index],
        name,
        content,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  // 템플릿 삭제
  function removeTemplate(id: string): void {
    templates.value = templates.value.filter((t) => t.id !== id);
  }

  // 템플릿 순서 변경
  function moveTemplate(fromIndex: number, toIndex: number): void {
    // 인덱스 범위 확인
    if (
      fromIndex < 0 ||
      fromIndex >= templates.value.length ||
      toIndex < 0 ||
      toIndex >= templates.value.length
    ) {
      return;
    }

    // 이동할 항목 저장
    const item = templates.value[fromIndex];

    // 원래 배열에서 항목 제거
    templates.value.splice(fromIndex, 1);

    // 새 위치에 항목 삽입
    templates.value.splice(toIndex, 0, item);
  }

  // 템플릿 내보내기
  function exportTemplates(): string {
    return JSON.stringify(templates.value);
  }

  // 템플릿 가져오기
  function importTemplates(json: string): void {
    try {
      const importedTemplates = JSON.parse(json);
      if (Array.isArray(importedTemplates)) {
        templates.value = importedTemplates;
        console.log(
          '템플릿 가져오기 성공:',
          templates.value.length,
          '개의 템플릿 로드됨'
        );
      }
    } catch (error) {
      console.error('템플릿 가져오기 실패:', error);
    }
  }

  return {
    templates,
    addTemplate,
    updateTemplate,
    removeTemplate,
    moveTemplate,
    exportTemplates,
    importTemplates,
  };
}
