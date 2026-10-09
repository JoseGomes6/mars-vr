# A Journey Across Mars

José Pedro Rodrigues Gomes - 2025171142

Unidade curricular: Ambientes de Realidade Virtual Interativos

Trabalho de realidade virtual: visita virtual 360º a Marte, feita com A-Frame.

## Objetivo

O objetivo deste trabalho é criar uma experiência de realidade virtual com três cenas 360º, em que o utilizador passa de uma cena para a outra através de portais e cada cena tem um painel com informação.

Escolhi o tema de Marte. As três cenas são:

1. **Perseverance**: selfie do rover Perseverance (NASA), com um painel sobre a missão. O portal leva à cena 2.
2. **Curiosity**: autorretrato do rover Curiosity, durante uma tempestade de poeira. O portal leva à cena 3.
3. **Rauna Crater**: vista de uma cratera, com um portal que volta à cena 1.

## Como ver

O projeto corre no navegador e não precisa de internet nem de instalar nada, mas tem de ser aberto através de um servidor local (se abrir o `index.html` diretamente, as imagens não carregam). Com o Python instalado, abrir um terminal na pasta do projeto e correr:

```bash
python3 -m http.server 8000
```

Depois abrir <http://localhost:8000> no navegador e clicar em "Start experience".

- **Olhar à volta:** arrastar com o rato.
- **Mudar de cena:** clicar no portal.
- **Fechar ou abrir o painel:** clicar no × / no botão "i", ou carregar na tecla I.
- **Em VR:** carregar no botão do óculos no canto inferior direito.

## Imagens

As imagens vêm da [Wikimedia Commons](https://commons.wikimedia.org) e foram redimensionadas.

| Uso                  | Imagem                                                                                                                                                                                                                  | Autor                                                     | Licença                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------- |
| Cena 1               | [Perseverance - Watson Selfie near Sally's Cove - Sol 1500 - 360° version](<https://commons.wikimedia.org/wiki/File:Perseverance_-_Watson_Selfie_near_Sally%27s_Cove_-_Sol_1500_-_360%C2%B0_version_(54512394173).jpg>) | NASA/JPL-Caltech/MSSS/Steve Albers/Simeon Schmauß         | Domínio público (NASA)       |
| Cena 2               | [MSL Sol 2082 - Spherical Projection](<https://commons.wikimedia.org/wiki/File:MSL_Sol_2082_-_Spherical_Projection_(42223856724).jpg>)                                                                                  | NASA/JPL-Caltech/MSSS/Kevin M. Gill                       | CC BY 2.0                    |
| Cena 3               | [360˚ View within Rauna Crater on Mars](<https://commons.wikimedia.org/wiki/File:360%CB%9A_View_within_Rauna_Crater_on_Mars_(33660895232).jpg>)                                                                         | Kevin M. Gill (dados NASA/JPL/University of Arizona/USGS) | Domínio público (dados NASA) |
| Ecrã inicial (Marte) | [OSIRIS Mars true color](https://commons.wikimedia.org/wiki/File:OSIRIS_Mars_true_color.jpg)                                                                                                                            | ESA & MPS for OSIRIS Team                                 | CC BY-SA 3.0 IGO             |
| Ecrã inicial (fundo) | [Gaia's all-sky view](<https://commons.wikimedia.org/wiki/File:Gaia%27s_all-sky_view_(ESA_Gaia_DR2_AllSky_Brightness_Colour_black_bg_8k).jpg>)                                                                          | ESA/Gaia/DPAC                                             | CC BY 4.0                    |
