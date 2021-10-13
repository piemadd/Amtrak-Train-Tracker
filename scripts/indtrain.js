let trains_holder = document.getElementById('trains_holder');
let stations_holder = document.getElementById('stations_holder');

const urlParams = new URLSearchParams(window.location.search);
const objectID = urlParams.get('train');

let train_obj = JSON.parse(localStorage.getItem(objectID))

console.log(train_obj)
console.log(localStorage)

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statuses = {
	'Late': 'late',
	'Early': 'early',
	'On Time': 'on-time',
	'Completed': 'completed',
	'No Data': 'completed',
}
let sch_dep_obj = new Date(train_obj.origSchDep);

let font_change = ' number-small';
if (train_obj.trainNum.toString().length > 2) {
	font_change = ' number-large';
}

let inner_html = `
<div class='meta'>
	<div class='title'>
		<h3>${train_obj.routeName}</h3>
		<div class='status ${statuses[train_obj.trainTimely]}'>${train_obj.trainTimely}</div>
	</div>
	<p class='route'>${months[sch_dep_obj.getMonth()]} ${sch_dep_obj.getDate()}, ${sch_dep_obj.getFullYear()}</p>
	<p class='route'>${train_obj.origCode} &rarr; ${train_obj.destCode}</p>
	<p class='location'><span class='tag'>Current Destination:</span> ${train_obj.eventCode}</p>
</div>

<div class='number${font_change}'>${train_obj.trainNum}</div>`;

trains_holder.setAttribute("id", train_obj.objectID);

trains_holder.innerHTML = inner_html;

train_obj.stations.forEach((station) => {

	let station_date = new Date(station.schDep || station.schArr);

	let arrival_est_act = '';
	let departure_est_act = '';
	let est_act = '';

	if (station.estArr) {
		est_act = 'Estimated';
		let date_arr = new Date(station.estArr);

		let early_late_stat = `(${station.estArrCmnt.replace(' HR', 'h').replace(' MI', 'm')})`.replace('(ON TIME)', '').replace('LATE', 'Late').replace('EARLY', 'Early')

		while (early_late_stat.length != 0 && early_late_stat.match(/0[0-9]/)) {
			console.log(early_late_stat.match(/0[0-9]/)[0])
			early_late_stat = early_late_stat.replace(/0[0-9]/, early_late_stat.match(/0[0-9]/)[0][1])
		}

		arrival_est_act = `<p class="location"><span class="tag">Arrival:</span> ${date_arr.getHours() % 12 || 12}:${date_arr.getMinutes().toString().padStart(2, '0')} ${(date_arr.getHours() >= 12) ? "PM" : "AM"} ${early_late_stat}</p>`
	} else if (station.postArr) {
		est_act = 'Actual';
		let date_arr = new Date(station.postArr);

		let early_late_stat = `(${station.postCmnt.replace(' HR', 'h').replace(' MI', 'm')})`.replace('(ON TIME)', '').replace('LATE', 'Late').replace('EARLY', 'Early')

		while (early_late_stat.length != 0 && early_late_stat.match(/0[0-9]/)) {
			console.log(early_late_stat.match(/0[0-9]/)[0])
			early_late_stat = early_late_stat.replace(/0[0-9]/, early_late_stat.match(/0[0-9]/)[0][1])
		}

		arrival_est_act = `<p class="location"><span class="tag">Arrival:</span> ${date_arr.getHours() % 12 || 12}:${date_arr.getMinutes().toString().padStart(2, '0')} ${(date_arr.getHours() >= 12) ? "PM" : "AM"} ${early_late_stat}</p>`
	} else {
		arrival_est_act = ''
	}

	if (station.estDep) {
		est_act = 'Estimated';
		let date_dep = new Date(station.estDep);

		let early_late_stat = `(${station.estDepCmnt.replace(' HR', 'h').replace(' MI', 'm')})`.replace('(ON TIME)', '').replace('LATE', 'Late').replace('EARLY', 'Early')

		while (early_late_stat.length != 0 && early_late_stat.match(/0[0-9]/)) {
			console.log(early_late_stat.match(/0[0-9]/)[0])
			early_late_stat = early_late_stat.replace(/0[0-9]/, early_late_stat.match(/0[0-9]/)[0][1])
		}

		departure_est_act = `<p class="location"><span class="tag">Departure:</span> ${date_dep.getHours() % 12 || 12}:${date_dep.getMinutes().toString().padStart(2, '0')} ${(date_dep.getHours() >= 12) ? "PM" : "AM"} ${early_late_stat}</p>`
	} else if (station.postDep) {
		est_act = 'Actual';
		let date_dep = new Date(station.postDep);

		let early_late_stat = `(${station.postCmnt.replace(' HR', 'h').replace(' MI', 'm')})`.replace('(ON TIME)', '').replace('LATE', 'Late').replace('EARLY', 'Early')

		console.log(early_late_stat)
		console.log(typeof early_late_stat)
		while (early_late_stat.length != 0 && early_late_stat.match(/0[0-9]/)) {
			console.log(early_late_stat.match(/0[0-9]/)[0])
			early_late_stat = early_late_stat.replace(/0[0-9]/, early_late_stat.match(/0[0-9]/)[0][1])
		}

		departure_est_act = `<p class="location"><span class="tag">Departure:</span> ${date_dep.getHours() % 12 || 12}:${date_dep.getMinutes().toString().padStart(2, '0')} ${(date_dep.getHours() >= 12) ? "PM" : "AM"} ${early_late_stat}</p>`
	} else {
		departure_est_act = ''
	}

	let inner_html = `
		<div class="meta">
			<div class="title">
				<h3>${station.code}</h3>
				<div class="status ${statuses[station.stationTimely]}">${station.stationTimely}</div>
			</div>
			<p class="route">${months[station_date.getMonth()]} ${station_date.getDay()}, ${station_date.getFullYear()}</p>
			<p class="route">${est_act} Arrival/Departure:</p>
			${arrival_est_act}
			${departure_est_act}
		</div>`

	let train_card = document.createElement('article');

	train_card.setAttribute("id", station.code);

	train_card.innerHTML = inner_html;

	stations_holder.appendChild(train_card)
})

const updateTrains = (() => {

	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	const statuses = {
		'Late': 'late',
		'Early': 'early',
		'On Time': 'on-time',
		'Completed': 'completed',
		'No Data': 'completed',
	}

	Object.keys(localStorage).forEach(async (objectID) => {
		let data;

		try {
			data = await fetch(`https://api.amtrak.cc/v1/trains/${JSON.parse(localStorage.getItem(objectID)).trainNum}`, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0',
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
				localStorage.setItem(objectID, JSON.stringify(data[i]));
				train_obj = data[i];
				break;
			}
		}

		if (train_obj.objectID == urlParams.get('train')) {


			let sch_dep_obj = new Date(train_obj.origSchDep);

			let font_change = ' number-small';
			if (train_obj.trainNum.toString().length > 2) {
				font_change = ' number-large';
			}

			let inner_html = `
			<div class='meta'>
				<div class='title'>
					<h3>${train_obj.routeName}</h3>
					<div class='status ${statuses[train_obj.trainTimely]}'>${train_obj.trainTimely}</div>
				</div>
				<p class='route'>${months[sch_dep_obj.getMonth()]} ${sch_dep_obj.getDate()}, ${sch_dep_obj.getFullYear()}</p>
				<p class='route'>${train_obj.origCode} &rarr; ${train_obj.destCode}</p>
				<p class='location'><span class='tag'>Current Destination:</span> ${train_obj.eventCode}</p>
			</div>

			<div class='number${font_change}'>${train_obj.trainNum}</div>`;

			let train_card = document.getElementById(objectID);

			train_card.innerHTML = inner_html;

			console.log(`updated ${objectID}`)
		}
	})
})

setInterval(function() {
	location.reload();
}, 60 * 1000);

updateTrains();