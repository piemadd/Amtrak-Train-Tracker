let listOfTrains = Object.values(localStorage)

let trains_holder = document.getElementById('trains_holder');

listOfTrains = listOfTrains.map((raw) => {
	return JSON.parse(raw);
})

let addButton = document.getElementsByClassName('add')[0];
addButton.remove();

listOfTrains.sort((a, b) => (a.trainNum > b.trainNum) ? 1 : -1)

const wait = ((delay) => {//milliseconds
    return new Promise((resolve) => setTimeout(resolve, delay));
})

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

listOfTrains.forEach((train_obj) => {
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

	let train_card = document.createElement('article');

	train_card.setAttribute("onclick", `window.location.href = "/view.html?train=${train_obj.objectID}"`);

	train_card.setAttribute("id", train_obj.objectID);

	train_card.innerHTML = inner_html;

	trains_holder.appendChild(train_card)
})

trains_holder.appendChild(addButton);

setInterval(function() {
	updateTrains()
}, 60 * 1000);

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function() {
		navigator.serviceWorker
			.register("/serviceWorker.js")
			.then(res => console.log("service worker registered"))
			.catch(err => console.log("service worker not registered", err))
	})
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

	Object.keys(localStorage).forEach(async (objectID) => {
		let data;

		try {
			data = await fetchRetry(`https://api.amtrak.cc/v1/trains/${JSON.parse(localStorage.getItem(objectID)).trainNum}`, 100, 3, {
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
			document.getElementById(train_obj).remove();
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

		console.log(Object.keys(train_obj).length)

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

	})
})

updateTrains();

let ua = navigator.userAgent.toLowerCase();
let isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
if (isAndroid) {
	console.log("Android")
} else if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
	console.log("Mobile but not android ig")
} else {
	console.log("Desktop")
}