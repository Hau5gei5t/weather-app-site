const APIKey = "844e52d7d99520b5bd08b40cb5021598" // оригинальный

const errors = {
    "401":"Возникла проблема с ключом API",
    "404":"Местоположение не найдено",
    "429":"Было сделано больше 60-ти запросов в минуту, пожалуйста воспользуйтесь сервисом позже",

}
class WeatherApp {
    constructor() {
        this.getPosition()
        this.widgets = [];
        this.latInput = document.querySelector('#lat');
        this.lonInput = document.querySelector('#lon');
        this.widgetsList = document.querySelector('.weather');
        document.querySelector('.geolocation__btn').addEventListener('click', evt => {
            if (evt.target && evt.target.matches('button')) {
                switch (evt.target.id) {
                    case 'confirm':
                        if (this.isValidInput()) {
                            this.createWidget();
                            this.latInput.classList.remove('invalid');
                            this.lonInput.classList.remove('invalid');

                        } else {
                            this.latInput.classList.add('invalid');
                            this.lonInput.classList.add('invalid');
                        }
                        break;
                    case 'refresh-all':
                        this.updateAllWidgets();
                }
            }
        });
    }

    getPosition(){
        navigator.geolocation.getCurrentPosition((success) => {
            let cords = success.coords
            lon.value = cords.longitude
            lat.value = cords.latitude
        })
    }

    createWidget() {
        this.widgets.push(new Widget(this.latInput.value, this.lonInput.value,
            this.widgets.length, this.widgetsList));
    }
    
    updateAllWidgets() {
        this.widgets.forEach(widget => {
            widget.update();
        });
    }

    isValidInput() {
        return this.latInput.value && this.lonInput &&
            parseFloat(this.latInput.value) <= 90 && parseFloat(this.latInput.value) >= -90 &&
            parseFloat(this.lonInput.value) <= 180 && parseFloat(this.lonInput.value) >= -180 &&
            this.latInput.value.toString().match(/[a-z|A-Z]/) == null &&
            this.lonInput.value.toString().match(/[a-z|A-Z]/) == null;
    }
}
let x = new WeatherApp()
class Widget{
    constructor(latitude, longitude, id, block) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.id = id;
        this.isActive = true;
        this.section = document.createElement('div')
        this.section.innerHTML = `
        <div class="weather__container">
            <div class="weather__card">
                <div class="weather__info-section"></div>
                <div id="map${this.id}" style="width: 500px; height: 300px; margin: 20px 20px"></div>
            </div>
        </div>
        `
        this.dataSection = this.section.querySelector('.weather__info-section');
        this.section.setAttribute('widgetId', id);
        block.append(this.section);
        this.createMap();
        this.render();
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }

    createMap() {
        let myMap = new ymaps.Map("map" + (this.id).toString(), {
                center: [this.latitude, this.longitude],
                zoom: 10,
                controls: []
            }),
            currentPos = new ymaps.GeoObject({
                geometry: {
                    type: "Point",
                    coordinates: [this.latitude, this.longitude]
                },
                properties: {
                    iconContent: 'Погода в этом месте',
                },
            }, {
                preset: 'islands#redStretchyIcon',
                draggable: false
            })
        myMap.geoObjects
            .add(currentPos)
    }

    render() {
        this.getJsonData(this.latitude, this.longitude)
            .then(data => {
                if (data.cod !== 200) {
                    throw new Error(`Произошла ошибка! Код: ${data.cod} \n Описание: ${errors[data.cod]}`);
                }
                let time = new Date().toLocaleTimeString('ru', { hour12: false, hour: "numeric",minute: "numeric"})
                this.dataSection.innerHTML = this.templateHTML(data, time);
                this.section.querySelectorAll('.weather__btn').forEach(elem => {
                    elem.addEventListener('click', event => {
                        if (event.target && event.currentTarget.matches('#refresh')) {
                            this.update();
                        }
                        if (event.target && event.currentTarget.matches('#delete')) {
                            this.delete();
                        }
                    });
                });
            })
            .catch(error => {
                console.error(error)
                alert(error)
                this.delete()
            });
    }

    templateHTML(data, time) {
        return `
                    <div class="weather__title">
                        <h2 class="weather__city">${data.name}</h2>
                        <p class="weather__time">Погода на текущее время: ${time}</p>
                    </div>
                    <div class="weather__main-info">
                        <p class="weather__temperature">${Math.round(data.main.temp)}°</p>
                        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" className="weather__icon">
                        <ul>
                            <li class="weather__description">${data.weather[0].description.toUpperCase()}</li>
                            <li>Ощущается как ${Math.round(data.main.feels_like)}°</li>
                        </ul>
                    </div>
                    <div class="weather__other-info">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" opacity=".5"> <g fill="#FFF" fill-rule="nonzero"> <path d="M6 11.5h5.688a3.75 3.75 0 1 0-1.95-6.954.75.75 0 0 0 .781 1.28A2.25 2.25 0 1 1 11.688 10L6 10.001a.75.75 0 1 0 0 1.5zM2 15h9.966a1.5 1.5 0 1 1-.779 2.782.75.75 0 0 0-.78 1.281 3 3 0 1 0 1.56-5.563H1.999A.75.75 0 1 0 2 15zM16.667 13h2.251a3 3 0 1 0-1.56-5.563.75.75 0 0 0 .781 1.28 1.5 1.5 0 1 1 .779 2.782l-2.251.001a.75.75 0 1 0 0 1.5z"/> </g> </svg>
                        <p>${data.wind.speed} м/с</p>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" opacity=".5"> <g> <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5487 8.0001C16.7829 6.74175 15.1271 4.67011 12.5637 1.75476C12.2645 1.41448 11.7342 1.41518 11.4359 1.75625C8.88065 4.67783 7.22597 6.74805 6.45489 7.99571C3.91532 12.1049 3.72409 15.9389 6.56528 18.751C9.63862 21.793 14.3621 21.792 17.4355 18.7512C20.2743 15.9425 20.0858 12.169 17.5487 8.0001ZM7.73087 8.78429C8.39019 7.71747 9.8183 5.91206 12.0019 3.39071C14.1889 5.90415 15.6153 7.70851 16.2673 8.77991C18.4829 12.4205 18.6344 15.4548 16.3805 17.6849C13.8915 20.1475 10.1092 20.1483 7.62047 17.685C5.36463 15.4522 5.51867 12.3638 7.73087 8.78429Z" fill="white"/> <path d="M12.7366 17.2967C14.3588 16.7579 15.4749 15.2362 15.4749 13.5C15.4749 13.0858 15.1391 12.75 14.7249 12.75C14.3107 12.75 13.9749 13.0858 13.9749 13.5C13.9749 14.5852 13.277 15.5366 12.2638 15.8732C11.8707 16.0038 11.6579 16.4283 11.7884 16.8214C11.919 17.2145 12.3436 17.4273 12.7366 17.2967Z" fill="white"/> </g> </svg>
                        <p>${data.main.humidity} %</p>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" opacity=".5"> <g> <path d="M14.1314 2.22778C14.5361 2.31569 14.793 2.71509 14.7051 3.11986C14.6172 3.52464 14.2178 3.78152 13.813 3.69362C13.2222 3.56532 12.6156 3.5 12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C16.6944 20.5 20.5 16.6944 20.5 12C20.5 11.4103 20.4401 10.8289 20.3222 10.2616C20.238 9.85608 20.4985 9.45902 20.904 9.37478C21.3096 9.29054 21.7067 9.55101 21.7909 9.95657C21.9295 10.624 22 11.3077 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.7228 2 13.4361 2.07681 14.1314 2.22778Z" fill="white"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M13.348 10.6533C13.6409 10.9461 14.1158 10.946 14.4086 10.6531L18.0304 7.03025C18.3233 6.73732 18.3232 6.26244 18.0303 5.96959C17.7373 5.67674 17.2624 5.67681 16.9696 5.96975L13.3478 9.59259C13.055 9.88553 13.055 10.3604 13.348 10.6533ZM8.21961 15.7803C8.51248 16.0732 8.98735 16.0732 9.28028 15.7804L10.5308 14.5301C10.8237 14.2373 10.8238 13.7624 10.5309 13.4695C10.238 13.1766 9.76315 13.1765 9.47023 13.4694L8.21972 14.7196C7.9268 15.0125 7.92675 15.4874 8.21961 15.7803Z" fill="white"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M14.75 5.75C14.75 5.33579 15.0858 5 15.5 5H18.25C18.6642 5 19 5.33579 19 5.75C19 6.16421 18.6642 6.5 18.25 6.5H15.5C15.0858 6.5 14.75 6.16421 14.75 5.75Z" fill="white"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5 5.75C17.5 5.33579 17.8358 5 18.25 5C18.6642 5 19 5.33579 19 5.75V8.5C19 8.91421 18.6642 9.25 18.25 9.25C17.8358 9.25 17.5 8.91421 17.5 8.5V5.75Z" fill="white"/> <path fill-rule="evenodd" clip-rule="evenodd" d="M9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12ZM13.5 12C13.5 12.8284 12.8284 13.5 12 13.5C11.1716 13.5 10.5 12.8284 10.5 12C10.5 11.1716 11.1716 10.5 12 10.5C12.8284 10.5 13.5 11.1716 13.5 12Z" fill="white"/> </g> </svg>
                        <p>${Math.round(data.main.pressure * 0.750064)} мм рт. ст.</p>
                    </div>
                    <div class="weather__btn-section">
                    <button class="weather__btn" id="refresh"><svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M24 40q-6.65 0-11.325-4.675Q8 30.65 8 24q0-6.65 4.675-11.325Q17.35 8 24 8q4.25 0 7.45 1.725T37 14.45V8h3v12.7H27.3v-3h8.4q-1.9-3-4.85-4.85Q27.9 11 24 11q-5.45 0-9.225 3.775Q11 18.55 11 24q0 5.45 3.775 9.225Q18.55 37 24 37q4.15 0 7.6-2.375 3.45-2.375 4.8-6.275h3.1q-1.45 5.25-5.75 8.45Q29.45 40 24 40Z"/></svg></button>
                    <button class="weather__btn" id="delete"><svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M13.05 42q-1.25 0-2.125-.875T10.05 39V10.5H8v-3h9.4V6h13.2v1.5H40v3h-2.05V39q0 1.2-.9 2.1-.9.9-2.1.9Zm21.9-31.5h-21.9V39h21.9Zm-16.6 24.2h3V14.75h-3Zm8.3 0h3V14.75h-3Zm-13.6-24.2V39Z"/></svg></button>
                    </div>
                    `;
    }

    async getJsonData(lat, lon) {
        return await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIKey}&units=metric&lang=ru`)
            .then(data => data.json())
            .catch(error => error);
    }
    delete() {
        if (!this.isActive) {
            return;
        }
        this.section.remove();
        this.isActive = !this.isActive;
    }

    update() {
        if (!this.isActive) {
            return;
        }
        this.render();
    }

}

