# Clock · Vitrine de relógios

Site vitrine da loja Clock. A página inicial monta um **Casio Edifice Preto** em 3D, peça por peça, conforme o visitante rola a página. Ao rolar para cima, a montagem volta.

## Páginas

| Página | Arquivo | Conteúdo |
|---|---|---|
| Início | `index.html` | Montagem 3D guiada pelo scroll, perguntas frequentes, contato e rodapé |
| Vitrine | `vitrine.html` | Produtos com filtro por tipo (automáticos, sociais, cronógrafos) |
| Edifice Preto | `edifice-preto.html` | Página do produto com destaques, preço sob consulta e ficha técnica |
| Por dentro | `por-dentro.html` | Filme do mecanismo e como funciona um relógio automático |
| A loja | `loja.html` | Visita com hora marcada e a seção interativa "Dê corda" |

- **Montagem 3D**: caixa, mecanismo, engrenagens, mostrador, ponteiros, vidro de safira e pulseira. São 19 peças modeladas em código, que começam flutuando em pilha sobre a caixa e descem para o lugar.
- **Cabeçalho**: botões em cápsula com um destaque que desliza até o botão sob o mouse e repousa na página atual. No celular vira um menu em tela cheia.
- **Contato**: botão de WhatsApp e formulário de interesse ou agendamento de visita. O formulário abre o WhatsApp com a mensagem pronta, sem servidor. Os botões "Tenho interesse" e "Agendar visita" das outras páginas levam ao formulário já preenchido (`index.html?produto=...&motivo=visita#contato`).

## Como ver no seu computador

O 3D precisa de um servidor local, porque o navegador bloqueia módulos JavaScript em arquivos abertos com dois cliques.

```bash
npx http-server . -p 8123
```

Depois abra http://127.0.0.1:8123 no navegador.

Abrindo o `index.html` direto, a página aparece inteira, mas com o herói parado no lugar da montagem.

## Estrutura

```
index.html           início: montagem 3D, perguntas e contato
vitrine.html         produtos
edifice-preto.html   página do produto
por-dentro.html      o mecanismo
loja.html            a loja e a visita
style.css            todos os estilos, compartilhados pelas páginas
script.js            comportamento das páginas e a cena 3D (só roda no início)
assets/              imagens, filme e texturas do relógio
```

Sem framework e sem etapa de build. As bibliotecas vêm de CDN:

- [Three.js](https://threejs.org/) 0.160 para a cena 3D
- [GSAP](https://gsap.com/) 3.12 com ScrollTrigger para ligar a montagem à rolagem

## Configuração

No topo do `script.js`:

```js
const SITE = {
  whatsapp: '',   // número com DDI e DDD, só dígitos. Ex.: 5511999999999
};
```

Enquanto o número estiver vazio, os botões abrem o WhatsApp sem destinatário.

## Comportamentos de acessibilidade e reserva

- **Movimento reduzido**: quem ativa essa preferência no sistema vê o relógio já montado, sem a jornada de rolagem.
- **Sem WebGL ou sem as bibliotecas**: o herói mostra uma imagem fixa do relógio com o texto final.
- **Celular**: a montagem 3D também roda, com o relógio no alto e as legendas embaixo.

## Pendências antes de publicar

- Preencher o número do WhatsApp.
- Trocar os três relógios de exemplo da vitrine (Aço Azul, Rosé Clássico, Crono Sport) pelos produtos reais da loja.
- Confirmar os textos de garantia e a ficha do Edifice Preto com os dados oficiais.
- Preencher `og:image` e `og:url` no `index.html` com o endereço final do site (procure por `DEPLOY STEP`).

## Créditos e avisos

- As imagens, o filme e as texturas do relógio foram gerados com inteligência artificial no Higgsfield e são ilustrativos.
- O relógio 3D foi modelado a partir de uma foto do produto. Proporções e mecanismo interno são aproximações, não o desenho técnico do fabricante.
- Casio e Edifice são marcas registradas da Casio Computer Co., Ltd. Este site não é afiliado à Casio.
