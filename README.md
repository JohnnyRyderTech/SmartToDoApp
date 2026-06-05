# Projektin nimi ja tekijät
Smart To-Do App by Johnny Kuoppala 

## Verkkolinkit:
Pääset julkaistuun sovellukseen käsiksi osoitteessa https://smartto-do-app.netlify.app/
Linkki projektin videoesittelyyn [google.com](https://google.com)

## Työn jakautuminen 
Tein sovelluksen itse yksin.

## Oma arvio työstä ja oman osaamisen kehittymisestä
Mielestäni onnistuin kohtalaisen hyvin. Sain toimintoja ja ominaisuuksia sovellukseen joita sinne halusin
Parantamista olisi ehkä ideoinnissa vielä ja visuaalisemmaksi tekemisessä.
Sovelluksesta jäi puuttumaan tekoäly avustaja. Syy oli, että se olisi vaatiunut API avaimen joka olisi pitänyt kätkeä backendiin. Ja backendiä varten olisi sellainen pitänyt sitten vielä tehdä ja siihen minulla ei ole vielä osaamista tietääkseni.
Koen, että olen oppinut paljonkin! Käyttämään ulkoisia kirjastoja, API avaimia, kirjoittamaan JavaScriptillä toiminnallisuuksia jne.
Epäselväksi jäi, no eipä oikein mikään. Noiden API pintojen kanssa kikkailu on ainva vähän haastavaa omalla tavallaan.
Antaisin itselleni pisteitä seuraavasti: 9/10p

## Palaute opettajalle kurssista sekä itse opetuksesta tähän saakka
Kurssi sekä lähiopetus ovat tuntuneet. Niin lähiopetustahan meillä ei ollut. Mutta koin kyllä, että kurssi oli oikein opettavainen! Lisäksi koin, että tukiopetusta ja apua oli saatavilla riittävästi.
Oppimistani tukisi jos olisi enemmän ehkä vielä täsmällisempää opetusta erilaisiin toimintoihin ja niiden etsimiseen. Mutta ymmärrettävästi se vaatisi enemmän kurssitunteja.


## Sisällysluettelo:

- [Tietoja sovelluksesta](#tietoja-sovelluksesta)
- [Tunnetut virheet/bugit](#Tunnetut virheet/bugit)
- [Kuvakaappaukset](#kuvakaappaukset)
- [Teknologiat](#teknologiat)
- [Asennus](#asennus)
- [Lähestymistapa](#lähestymistapa)
- [Kiitokset](#kiitokset)
- [Lisenssi](#lisenssi)

## Tietoja sovelluksesta
Smart To-Do App on sovellus, joka on monipuolinen, mutta kuitenkin sopivan yksinkertainen sovellus muistuttamaan tehtävistä ja määräajoista ja toimii myös muistilistana.

## Tunnetut virheet/bugit
Toistaiseksi olen heittänyt kavereilleni testi-ajoon sovellusta ja olen heidän avullaan löytänyt ja korjannut löydetyt bugit.

## Kuvakaappaukset
Lisää tähän vähintään yksi kuvakaappaus toimivasta sovelluksesta  
`![Kirjoittaminen](https://unsplash.com/photos/VBPzRgd7gfc)`

Kuva: [Kelly Sikkema](https://unsplash.com/@kellysikkema)

## Teknologiat
Projektissa käytettiin seuraavia teknologioita:
HTML – sovelluksen rakenteen luomiseen. HTMLä rakennettiin tehtävien lisäyslomake, tehtävälista, kategoriavalinnat, tehtävähistoria, alatehtävät ja motivaatiolauseen näyttävä osio.
CSS – sovelluksen ulkoasun toteuttamiseen. CSSä tehtiin tumma, maanläheinen ja luontomainen värimaailma sekä responsiivinen asettelu eri näytöille.
JavaScript – sovelluksen toiminnallisuuden toteuttamiseen. JavaScriptillä hallitaan tehtävien lisääminen, poistaminen, kuittaaminen, alatehtävät, kategoriat, muistutukset, countdown-laskuri ja localStorage-tallennus.
jQuery – DOM-elementtien käsittelyyn ja tapahtumankuuntelijoihin. jQueryä käytettiin esimerkiksi lomakkeen lähetyksen, painikkeiden klikkausten, tehtävälistan päivittämisen ja käyttöliittymän dynaamisen muokkaamisen toteuttamiseen.
Axios – AJAX-kutsujen tekemiseen. Sovelluksessa Axiosia käytetään satunnaisen motivaatiolauseen hakemiseen ulkoisesta rajapinnasta sovelluksen alaosaan.
Bootstrap – responsiivisen ulkoasun ja valmiiden käyttöliittymäkomponenttien hyödyntämiseen. Bootstrap helpotti lomakkeiden, painikkeiden ja sivun asettelun rakentamista.
Day.js – päivämäärien ja kellonaikojen käsittelyyn. Sitä käytettiin tehtävien määräaikojen, muistutusten ja countdown-laskurin toteuttamisessa.
SweetAlert2 – visuaalisiin ilmoitusikkunoihin. Sitä käytettiin esimerkiksi muistutuksissa, poistovahvistuksissa ja käyttäjälle näytettävissä ilmoituksissa.
Howler.js – muistutusäänien toistamiseen. Sovelluksessa käyttäjä voi valita eri muistutusääniä, kuten pehmeän ilmoitusäänen, lintujen laulun tai hälytysäänen.
Animate.css – kevyisiin animaatioihin. Sitä käytettiin esimerkiksi tehtävien ilmestymiseen listalle.
localStorage – tehtävien, alatehtävien ja kategorioiden tallentamiseen selaimeen. Tämän ansiosta tiedot säilyvät, vaikka sivu päivitetään tai selain suljetaan.


## Asennus
Sovellus on julkaistu Netlify-palvelussa, joten sitä voi käyttää suoraan selaimessa ilman erillistä asennusta.

Käyttö selaimessa:

Avaa sovelluksen Netlify-osoite selaimessa.
Sovellus käynnistyy automaattisesti.
Sovellusta voi käyttää heti ilman kirjautumista tai erillisiä asennuksia.

Vaihtoehtoisesti sovelluksen voi avata paikallisesti omalla koneella:

Lataa tai kloonaa repositorio GitHubista.
Varmista, että kansiorakenne on seuraavanlainen:
project-folder/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── images/
Avaa index.html selaimessa.

Sovellus ei vaadi erillistä backend-palvelinta tai npm-asennuksia, koska käytetyt ulkoiset kirjastot ladataan CDN-linkkien kautta. Sovelluksen tiedot tallentuvat selaimen localStorageen, joten tehtävät säilyvät samalla selaimella myös sivun päivittämisen jälkeen.

Sovelluksen käyttö:
- Lisää uusi tehtävä kirjoittamalla tehtävän nimi lomakkeeseen.
- Valitse halutessasi päivämäärä, kellonaika, prioriteetti, muistutusääni ja kategoria.
- Luo omia kategorioita ja määritä niille oma väri.
- Lisää tehtävän alle alakohtia, jos tehtävä koostuu useammasta pienemmästä osasta.
- Merkitse tehtäviä ja alakohtia valmiiksi valintaruuduista.
- Seuraa tehtävän määräaikaa countdown-laskurista.
- Jos määräaika ylittyy, sovellus näyttää tehtävässä varoitusmerkinnän.
- Tarkastele valmiita tehtäviä tehtävähistorian kautta.

Sovelluksen alaosassa näytetään Axiosilla haettu satunnainen motivaatiolause.
Sovellus tallentaa tiedot automaattisesti selaimen localStorageen.

## Kiitokset
Lähteitä en käyttänyt tähän projektiin muuta kuin jumppasin ChatGPT:tä käyttäen opastamaan miten saan erilaisia ominaisuuksia kirjoitettua sovellukseen.
Isot kiitokset lähipiirille, ystäville ja tutuille jotka antoivat palautetta ja testasivat sovellusta bugien varalta.

## Lisenssi
Valitse projektille lisenssi seuraamalla tätä [opasta](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/adding-a-license-to-a-repository).

Esimerkki: MIT-lisenssi @ [tekijä](author.com)
