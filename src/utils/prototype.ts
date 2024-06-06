FormData.prototype.getObject = function () {
  const result: AnyObject = {};

  const multiFieldProcess = (object: AnyObject, dotArr: Array<string>, value: FormDataEntryValue) => {
    const lastIndex = dotArr.length - 1;

    for (const [index, key] of dotArr.entries()) {
      if (index === lastIndex) {
        break;
      }

      if (!Object.hasOwn(object, key)) {
        object[key] = object[key] || {};
      }

      object = object[key];
    }

    object[dotArr[dotArr.length - 1]] = value;
  };
  const oneFieldProcess = (object: AnyObject, key: string, value: FormDataEntryValue) => {
    if (Object.hasOwn(object, key)) {
      let valueArr = [];

      if (object[key].constructor === Array) {
        valueArr = object[key];
        valueArr.push(value);
      } else {
        valueArr.push(object[key]);
        valueArr.push(value);
      }

      object[key] = valueArr;
    } else {
      object[key] = value;
    }
  };

  try {
    for (const [key, value] of this) {
      const dotArr = key.split('.').filter((item) => item !== '');

      if (dotArr.length >= 2) {
        multiFieldProcess(result, dotArr, value);
      } else {
        oneFieldProcess(result, key, value);
      }
    }
  } catch (error) {
    console.log(error);
  }

  return result;
};
