export function Cache() {
  return function (
    target: any,
    propertyName: string,
    propertyDescriptor: PropertyDescriptor,
  ) {
    const originalMethod = propertyDescriptor.value;

    propertyDescriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      return result;
    };
  };
}