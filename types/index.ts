// 템플릿 타입 정의
export interface Template {
  id: string;
  name: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

// 이름 관련 타입 정의
export interface NameItem {
  id: string;
  name: string;
}

export interface FilledPlaceholder {
  [key: string]: string[];
}
