'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerEarthquakes = document.querySelector('.earthquakes');
const inputTime = document.querySelector('.form__input--time');
const inputStrength = document.querySelector('.form__input--strength');
const inputDuration = document.querySelector('.form__input--duration');

const inputElevation = document.querySelector('.form__input--matDmg');

const btnReport = document.querySelector('.reportBtn');

class Earthquake {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, strength, duration, time, matDmg) {
    this.coords = coords;
    this.strength = strength;
    this.duration = duration;
    this.matDmg = matDmg;
    this.time = time;
    this._setDescription();
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `Earthquake on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class App {
  #map;
  #mapEvent;
  #earthquakes = [];
  #mapZoomLevel = 13;
  constructor() {
    // Get users position
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();

    //attach event handlers
    form.addEventListener('submit', this._newEarthquake.bind(this));

    containerEarthquakes.addEventListener(
      'click',
      this._moveToPopup.bind(this)
    );
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#earthquakes.forEach(work => this._renderEarthquakeMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputStrength.focus();
  }
  _hideForm() {
    //empty input
    inputStrength.value = inputDuration.value = inputElevation.value = ' ';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newEarthquake(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // get data from form

    const strength = +inputStrength.value;
    const duration = +inputDuration.value;
    const time = +inputTime.value;
    const matDmg = inputElevation.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let earthquake;
    // check if data is valid

    if (
      !validInputs(strength, duration, time) ||
      !allPositive(strength, duration, time)
    )
      return alert('Inputs have to be positive numbers!');

    earthquake = new Earthquake([lat, lng], strength, duration, time, matDmg);

    // add new object to earthquakes array
    this.#earthquakes.push(earthquake);

    // redner earthquake on map marker

    this._renderEarthquakeMarker(earthquake);
    // render earthquaket on list
    this._renderEarthquake(earthquake);
    // hide form +clear input fields
    this._hideForm();

    //set local storage to all earthquakes
    this._setLocalStorage();
  }

  _renderEarthquakeMarker(earthquake) {
    L.marker(earthquake.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `Eartquake`,
        })
      )
      .setPopupContent(`⚡️${earthquake.description}`)
      .openPopup();
  }

  _renderEarthquake(earthquake) {
    let html = `
    <li class="earthquake earthquake--list" data-id="${earthquake.id}">
    <h2 class="earthquake__title">${earthquake.description}</h2>
      <div class="earthquake__details">
        <span class="earthquake__icon">
        ⚡️ </span>
        <span class="earthquake__value">${earthquake.strength}</span>
        <span class="earthquake__unit">strength</span>
      </div>
    <div class="earthquake__details">
      <span class="earthquake__icon">⏱</span>
      <span class="earthquake__value">${earthquake.duration}</span>
      <span class="earthquake__unit">sec</span>
    </div>
    <div class="earthquake__details">
      <span class="earthquake__icon">⏰</span>
      <span class="earthquake__value">${earthquake.time}</span>
      <span class="earthquake__unit">min ago</span>
    </div>
    <div class="earthquake__details">
      <span class="earthquake__icon">🌆</span>
      <span class="earthquake__value">${earthquake.matDmg}</span>
      <span class="earthquake__unit">material damage</span>
    </div>
  </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const earthquakeEl = e.target.closest('.earthquake');
    //

    if (!earthquakeEl) return;

    const earthquake = this.#earthquakes.find(
      work => work.id === earthquakeEl.dataset.id
    );
    console.log(earthquake);

    this.#map.setView(earthquake.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('earthquakes', JSON.stringify(this.#earthquakes));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('earthquakes'));

    if (!data) return;

    this.#earthquakes = data;
    this.#earthquakes.forEach(work => this._renderEarthquake(work));
  }

  reset() {
    localStorage.removeItem('earthquakes');
    location.reload();
  }
}

const app = new App();

btnReport.addEventListener('click', function () {
  let html = `<div class="earthquake--info" id="earthquake--info">
  <h2 class="earthquake__title">EarthRep is an app for reporting earthquakes<br /></h2>
    <p>Make a click on map, fill the form and press enter to report!<br /> If you have any questions or advices feel free to contact on mail:<br /> <em>roko.pivac@gmail.com</em><br />or on my Github:<br /> <a href="https://github.com/rpivac00" target:_blank>rpivac00</a> </p>
  </div>`;

  form.insertAdjacentHTML('afterend', html);

  map.addEventListener('mouseover', function () {
    const element = document.getElementById('earthquake--info');
    element?.remove();
  });
});
