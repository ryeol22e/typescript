export {};

declare global {
  interface AnyObject {
    [key: string | number]: any;
  }
  interface FormData {
    getObject(): AnyObject;
  }
}
