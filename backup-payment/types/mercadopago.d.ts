interface MercadoPagoInstance {
  checkout(options: any): void;
  createCardToken(options: any): Promise<any>;
  getIdentificationTypes(): Promise<any>;
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: any) => MercadoPagoInstance;
  }
}

export {};