export const environment = {
  production: true,
  google: {
    // Mesmo client_id do environment.ts — o OAuth Client ID do Google Cloud
    // Console tem as origens autorizadas (localhost + produção) cadastradas
    // nele mesmo, então o valor pode ser o mesmo nos dois arquivos.
    clientId: '',
  },
};
