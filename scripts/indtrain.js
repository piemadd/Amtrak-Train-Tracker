const adsThing = document.createElement('script');

if (window.location.hostname == 'amtraker.com') {
    adsThing.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9074000161783128';
    adsThing.crossorigin = 'anonymous';
    adsThing.async = '';
    document.head.appendChild(adsThing);
}

let dummyTrains = document.getElementsByClassName('dummy')
let dummyTrainsLength = dummyTrains.length
for (let i = 0; i < dummyTrainsLength; i++) {
    dummyTrains[0].remove()
}

const convertTZ = ((date, tzString) => {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
})

const isDstObserved = (() => {
	let date = new Date();

	let year = date.getFullYear();
	let dst_start = new Date(year, 2, 14);
	let dst_end = new Date(year, 10, 7);
	dst_start.setDate(14 - dst_start.getDay()); // adjust date to 2nd Sunday
	dst_end.setDate(7 - dst_end.getDay()); // adjust date to the 1st Sunday

	return (date >= dst_start && date < dst_end);
})

const currentTimeCode = ((trainTimeZone) => {
	const date = new Date();

	if (localStorage.getItem('settings_tz') == 1) {
		return trainTimeZone;
	}

	const standard = {
		300: "EST",
		360: "CST",
		420: "MST",
		480: "PST"
	}

	const daylight = {
		240: "EDT",
		300: "CDT",
		360: "MDT",
		420: "PDT"
	}

	if (isDstObserved()) {
		return daylight[date.getTimezoneOffset()];
	} else {
		return standard[date.getTimezoneOffset()];
	}
})

//returns " (HH:MM TD TZT)" if show both is selected
const altTime = ((date, stationTz) => {

	//let tz = train_obj.trainTimeZone
    let tz = stationTz
    
	if (tz == "PST") {
		tz = "PST8PDT";
	}

    if (tz == "CST") {
        tz = "America/Chicago" //shit is inconsistent
    }
    

	if (localStorage.getItem('settings_tz') == 2) {
		date = convertTZ(date, tz)

        return ` (${date.getHours() % 12 || 12}:${date.getMinutes().toString().padStart(2, '0')} ${(date.getHours() >= 12) ? "PM" : "AM"} ${stationTz})`
	} else {
		return '';
	}
})

let trains_holder = document.getElementById('trains_holder_ind');
let stations_holder = document.getElementById('stations_holder');

const urlParams = new URLSearchParams(window.location.search);
const objectID = urlParams.get('train');

const fetchRetry = ((url, delay, tries, fetchOptions = {}) => {
    function onError(err){
        triesLeft = tries - 1;
        if(!triesLeft){
            throw err;
        }
        return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
    }
    return fetch(url,fetchOptions).catch(onError);
})

let train_obj = {}

const updateTrainsIDKFUCKYOU = (async () => {
	let data;

	if(!(Object.keys(localStorage).includes(`train_${objectID}`))) {
		try {
			let headers = {
				'User-Agent': 'AmtrakerUI/1.0 (Fart Poop 69.420; Win69; x8008; rvp00p;)',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5',
				'Connection': 'keep-alive',
				'Upgrade-Insecure-Requests': '1',
				'Sec-Fetch-Dest': 'document',
				'Sec-Fetch-Mode': 'navigate',
				'Sec-Fetch-Site': 'none',
				'Sec-Fetch-User': '?1',
				'Pragma': 'no-cache',
				'Cache-Control': 'no-cache',
				'TE': 'trailers'
			}

			let ids = await fetchRetry('https://api.amtraker.com/v1/trains/ids', 100, 3, {
				headers: headers
			}).then(response => response.json()).then((data) => {
				return data;
			})

			data = await fetchRetry(`https://api.amtraker.com/v1/trains/${ids[objectID]}`, 100, 3, {
				headers: headers
			}).then(response => response.json()).then((data) => {
				return data;
			})

		} catch {
			temp_id = objectID;
			console.log("fucky wucky!")
			console.log(temp_id)
			console.log(document.getElementById(temp_id))
			localStorage.removeItem(`train_${temp_id}`)
		}

		let train_obj = {};

		for (let i = 0; i < data.length; i++) {

			if (data[i].objectID == objectID) {
				await localStorage.setItem(`train_${objectID}`, JSON.stringify(data[i]));
				train_obj = data[i];
				break;
			}
		}
	}
})

updateTrainsIDKFUCKYOU().then(() => {

	updateTrains();

	train_obj = JSON.parse(localStorage.getItem(`train_${objectID}`))

	let sch_dep_obj = new Date(train_obj.origSchDep);

	if (localStorage.getItem('settings_tz') == 1) {
		sch_dep_obj = convertTZ(sch_dep_obj, train_obj.trainTimeZone);
	}

	let font_change = ' number-small';
	if (train_obj.trainNum.toString().length > 2) {
		font_change = ' number-large';
	}

	if (train_obj.velocity == null) {
		train_obj.velocity = 0;
	}

	let inner_html = `
	<div class='meta'>
		<div class='title'>
			<h3>${train_obj.routeName}</h3>
			<div class='status ${statuses[train_obj.trainTimely]}'>${train_obj.trainTimely}</div>
		</div>
		<p class='route'>${months[sch_dep_obj.getMonth()]} ${sch_dep_obj.getDate()}, ${sch_dep_obj.getFullYear()} - ${train_obj.origCode} --> ${train_obj.destCode}</p>
		<p class='route'><span class='tag'>Current Speed: </span>${train_obj.velocity.toFixed(2)} mph</p>
		<p class='location'><span class='tag'>Current Destination:</span> ${train_obj.eventName} (${train_obj.eventCode})</p>
	</div>

	<div class='number${font_change}'>${train_obj.trainNum}</div>`;

	trains_holder.setAttribute("id", train_obj.objectID);

	trains_holder.innerHTML = inner_html;

	train_obj.stations.forEach((station) => {

		let station_date = new Date(station.schDep || station.schArr);

		if (localStorage.getItem('settings_tz') == 1) {
			station_date = convertTZ(station_date, train_obj.trainTimeZone);
		}

		let arrival_est_act = '';
		let departure_est_act = '';
		let est_act = '';

		if (station.estArr) {
			est_act = 'Estimated';
			let date_arr = new Date(station.estArr);

			if (localStorage.getItem('settings_tz') == 1) {
				date_arr = convertTZ(date_arr, train_obj.trainTimeZone);
			}
            
			let early_late_stat = `(${station.estArrCmnt.replace(' HR', 'h').replace(' MI', 'm')})`.replace('(ON TIME)', '').replace('LATE', 'Late').replace('EARLY', 'Early')

			while (early_late_stat.length != 0 && early_late_stat.match(/0[0-9]/)) {
				early_late_stat = early_late_stat.replace(/0[0-9]/, early_late_stat.match(/0[0-9]/)[0][1])
			}

			arrival_est_act = `<p class="location"><span class="tag">Arrival:</span> ${date_arr.getHours() % 12 || 12}:${date_arr.getMinutes().toString().padStart(2, '0')} ${(date_arr.getHours() >= 12) ? "PM" : "AM"} ${currentTimeCode(train_obj.trainTimeZone)}${altTime(date_arr, station.tz)} ${early_late_stat}</p>`
		} else if (station.postArr) {
			est_act = 'Actual';
			let date_arr = new Date(station.postArr);

			if (localStorage.getItem('settings_tz') == 1) {
				date_arr = convertTZ(date_arr, train_obj.trainTimeZone);
			}

			let early_late_stat = `(${station.postCmnt.replace(' HR', 'h').replace(' MI', 'm')})`.replace('(ON TIME)', '').replace('LATE', 'Late').replace('EARLY', 'Early')

			while (early_late_stat.length != 0 && early_late_stat.match(/0[0-9]/)) {
				early_late_stat = early_late_stat.replace(/0[0-9]/, early_late_stat.match(/0[0-9]/)[0][1])
			}

			arrival_est_act = `<p class="location"><span class="tag">Arrival:</span> ${date_arr.getHours() % 12 || 12}:${date_arr.getMinutes().toString().padStart(2, '0')} ${(date_arr.getHours() >= 12) ? "PM" : "AM"} ${currentTimeCode(train_obj.trainTimeZone)}${altTime(date_arr, station.tz)} ${early_late_stat}</p>`
		} else {
			arrival_est_act = ''
		}

		if (station.estDep) {
			est_act = 'Estimated';
			let date_dep = new Date(station.estDep);

			if (localStorage.getItem('settings_tz') == 1) {
				date_dep = convertTZ(date_dep, train_obj.trainTimeZone);
			}

			let early_late_stat = `(${station.estDepCmnt.replace(' HR', 'h').replace(' MI', 'm')})`.replace('(ON TIME)', '').replace('LATE', 'Late').replace('EARLY', 'Early')

			while (early_late_stat.length != 0 && early_late_stat.match(/0[0-9]/)) {
				early_late_stat = early_late_stat.replace(/0[0-9]/, early_late_stat.match(/0[0-9]/)[0][1])
			}

			departure_est_act = `<p class="location"><span class="tag">Departure:</span> ${date_dep.getHours() % 12 || 12}:${date_dep.getMinutes().toString().padStart(2, '0')} ${(date_dep.getHours() >= 12) ? "PM" : "AM"} ${currentTimeCode(train_obj.trainTimeZone)}${altTime(date_dep, station.tz)} ${early_late_stat}</p>`
		} else if (station.postDep) {
			est_act = 'Actual';
			let date_dep = new Date(station.postDep);

			if (localStorage.getItem('settings_tz') == 1) {
				date_dep = convertTZ(date_dep, train_obj.trainTimeZone);
			}

			let early_late_stat = `(${station.postCmnt.replace(' HR', 'h').replace(' MI', 'm')})`.replace('(ON TIME)', '').replace('LATE', 'Late').replace('EARLY', 'Early')

			while (early_late_stat.length != 0 && early_late_stat.match(/0[0-9]/)) {
				early_late_stat = early_late_stat.replace(/0[0-9]/, early_late_stat.match(/0[0-9]/)[0][1])
			}

			departure_est_act = `<p class="location"><span class="tag">Departure:</span> ${date_dep.getHours() % 12 || 12}:${date_dep.getMinutes().toString().padStart(2, '0')} ${(date_dep.getHours() >= 12) ? "PM" : "AM"} ${currentTimeCode(train_obj.trainTimeZone)}${altTime(date_dep, station.tz)} ${early_late_stat}</p>`
		} else {
			departure_est_act = ''
		}

		if (train_obj.velocity == null) {
			train_obj.velocity = 0;
		}

		let inner_html = `
			<div class="meta">
				<div class="title">
					<h3>${station.stationName} (${station.code})</h3>
					<div class="status ${statuses[station.stationTimely]}">${station.stationTimely}</div>
				</div>
				<p class="route">${months[station_date.getMonth()]} ${station_date.getDate()}, ${station_date.getFullYear()}</p>
				<p class="route">${est_act} Arrival/Departure:</p>
				${arrival_est_act}
				${departure_est_act}
			</div>`

		let train_card = document.createElement('a');
        train_card.classList.add("card");

        if (station.code == train_obj.eventCode) {
            train_card.classList.add("activeStation");
        }
        
		train_card.setAttribute("id", station.code);

		train_card.innerHTML = inner_html;

		stations_holder.appendChild(train_card)
	})

	setInterval(function() {
		location.reload();
	}, 60 * 1000);
})

const wait = ((delay) => {//milliseconds
    return new Promise((resolve) => setTimeout(resolve, delay));
})

const yeet = (() => {
	localStorage.removeItem(`train_${train_obj.objectID}`);
	console.log('yeet dab')
	window.location.href='/'	
})

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statuses = {
	'Late': 'late',
	'Early': 'early',
	'On Time': 'on-time',
	'Completed': 'completed',
	'No Data': 'completed',
}

const updateTrains = (() => {

	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	const statuses = {
		'Late': 'late',
		'Early': 'early',
		'On Time': 'on-time',
		'Completed': 'completed',
		'No Data': 'completed',
	}

	let listOfTrainsKeys = Object.keys(localStorage)

	listOfTrainsKeys = listOfTrainsKeys.filter((item) => {
		return (item.indexOf("settings") !== 0 && item.indexOf("train") == 0);
	});

	listOfTrainsKeys.forEach(async (objectID) => {
		let data;

		try {
			data = await fetchRetry(`https://api.amtraker.com/v1/trains/${JSON.parse(localStorage.getItem(objectID)).trainNum}`, 100, 3, {
				headers: {
					'User-Agent': 'AmtrakerUI/1.0 (Fart Poop 69.420; Win69; x8008; rvp00p;)',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.5',
					'Connection': 'keep-alive',
					'Upgrade-Insecure-Requests': '1',
					'Sec-Fetch-Dest': 'document',
					'Sec-Fetch-Mode': 'navigate',
					'Sec-Fetch-Site': 'none',
					'Sec-Fetch-User': '?1',
					'Pragma': 'no-cache',
					'Cache-Control': 'no-cache',
					'TE': 'trailers'
				}
			}).then(response => response.json()).then((data) => {
				return data;
			})

		} catch {
			localStorage.removeItem(objectID)
			return;
		}

		let train_obj = {};

		for (let i = 0; i < data.length; i++) {
			if (data[i].objectID == objectID) {
				objectID.substring(6)
				localStorage.setItem(`train_${objectID}`, JSON.stringify(data[i]));
				train_obj = JSON.parse(localStorage.getItem(`train_${objectID}`));
				break;
			}
		}

		if (train_obj.objectID == urlParams.get('train')) {
			let sch_dep_obj = new Date(train_obj.origSchDep);

			if (localStorage.getItem('settings_tz') == 1) {
				sch_dep_obj = convertTZ(sch_dep_obj, train_obj.trainTimeZone);
			}

			let font_change = ' number-small';
			if (train_obj.trainNum.toString().length > 2) {
				font_change = ' number-large';
			}

			if (train_obj.velocity == null) {
				train_obj.velocity = 0;
			}

			let inner_html = `
			<div class='meta'>
				<div class='title'>
					<h3>${train_obj.routeName}</h3>
					<div class='status ${statuses[train_obj.trainTimely]}'>${train_obj.trainTimely}</div>
				</div>
				<p class='route'>${months[sch_dep_obj.getMonth()]} ${sch_dep_obj.getDate()}, ${sch_dep_obj.getFullYear()} - ${train_obj.origCode} --> ${train_obj.destCode}</p>
				<p class='route'><span class='tag'>Current Speed: </span>${train_obj.velocity.toFixed(2)} mph</p>
				<p class='location'><span class='tag'>Current Destination:</span> ${train_obj.eventCode}</p>
			</div>

			<div class='number${font_change}'>${train_obj.trainNum}</div>`;

			let train_card = document.getElementById(objectID);

			train_card.innerHTML = inner_html;

			console.log(`updated ${objectID}`)
		}
	})
})

