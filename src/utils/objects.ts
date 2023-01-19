import { get, pick, flatten, isPlainObject, map } from 'lodash';

export const extractObjectByPath = (mainObject: object, path: string | string[]) => {
  try {
    if (typeof path === 'string') {
      return { [path]: mainObject[path] };
    }
    const firstKey = path[0];
    if (!path.length) return null;
    if (path.length === 1) {
      return { [firstKey]: mainObject[firstKey] };
    }
    const lastKey = path[path.length - 1];
    return { [firstKey]: pick(get(mainObject, firstKey), lastKey) };
  } catch (error) {
    return null;
  }
};

export const extractValueByPath = (mainObject: object, path: string[]) => {
  return get(mainObject, path);
};

export const createPathsFromObject = (obj: object): string[][] => {
  return flatten(
    map(obj, (value, key) => {
      if (isPlainObject(value)) {
        return createPathsFromObject(value).map((path) => [key, path]);
      } else {
        return key;
      }
    }),
  );
};
