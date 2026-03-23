HTMLFormElement.prototype.getObject = function (): Record<string, unknown> {
  const formData = new FormData(this);
  const result: Record<string, unknown> = {};
  // 헬퍼 1: 안전하지 않은 키 필터링
  const isUnsafeKey = (key: string): boolean =>
    key === '__proto__' || key === 'constructor' || key === 'prototype';

  // 헬퍼 2: 키 파싱 및 유효성 검사
  const parseKeys = (rawKey: string): string[] | null => {
    const cleanKey = rawKey.endsWith('[]') ? rawKey.slice(0, -2) : rawKey;
    const parts = cleanKey.match(/[^.\\[\]]+/g);

    if (parts === null || parts.length === 0 || parts.some(isUnsafeKey)) {
      return null;
    }

    return parts;
  };

  // 헬퍼 3: 객체 경로 탐색 및 충돌 방지 초기화
  const traverse = (
    obj: Record<string, unknown>,
    parts: string[],
  ): Record<string, unknown> => {
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];

      const isUndefined = current[part] === undefined;
      const isString = typeof current[part] === 'string';

      if (isUndefined || isString) {
        const isNextArray = /^(?:0|[1-9]\d*)$/.test(nextPart);
        current[part] = (isNextArray ? [] : {}) as unknown;
      }

      current = current[part] as Record<string, unknown>;
    }

    return current;
  };

  // 헬퍼 4: 값 할당 로직
  const appendValue = (
    leaf: Record<string, unknown>,
    key: string,
    value: FormDataEntryValue,
    forceArray: boolean,
  ): void => {
    const existing = leaf[key];
    const isArray = Array.isArray(existing);

    if (existing === undefined) {
      // forceArray가 true면 첫 데이터라도 무조건 배열로 감쌉니다.
      leaf[key] = forceArray ? [value] : value;
    } else if (isArray) {
      (existing as unknown[]).push(value);
    } else {
      leaf[key] = [existing, value];
    }
  };

  // 헬퍼 5: 폼 내 강제 배열화 대상 이름 수집 (체크박스, 다중 셀렉트 등)
  const getArrayNames = (form: HTMLFormElement): Set<string> => {
    const arrayNames = new Set<string>();
    const nameCounts = new Map<string, number>();

    for (const el of Array.from(form.elements)) {
      const input = el as HTMLInputElement | HTMLSelectElement;
      const name = input.name;

      if (name === '' || name === undefined) {
        continue;
      }

      const count = (nameCounts.get(name) ?? 0) + 1;
      nameCounts.set(name, count);

      const isMultipleSelect = input.type === 'select-multiple';

      // 수정된 부분: 동일한 코드 블록을 실행하는 조건들을 || (OR) 연산자로 병합
      if (isMultipleSelect || (input.type !== 'radio' && count > 1)) {
        arrayNames.add(name);
      }
    }

    return arrayNames;
  };

  // 폼 내부에 중복된 name을 가진 요소들을 미리 파악합니다.
  const arrayNames = getArrayNames(this);

  for (const [key, value] of formData.entries()) {
    const parts = parseKeys(key);

    if (parts === null) {
      continue;
    }

    const leafNode = traverse(result, parts);
    const lastPart = parts.at(-1) ?? '';

    // 이름이 []로 끝나거나, DOM에 동일한 name이 여러 개 존재하는 경우 강제로 배열 처리합니다.
    const forceArray = key.endsWith('[]') || arrayNames.has(key);

    appendValue(leafNode, lastPart, value, forceArray);
  }

  return result;
};
