let listOfTrains = Object.values(localStorage)

let trains_holder = document.getElementById('trains_holder');

listOfTrains = listOfTrains.map((raw) => {
	return JSON.parse(raw);
})

let addButton = document.getElementsByClassName('add')[0];
addButton.remove();


console.log(listOfTrains)
listOfTrains.sort((a, b) => (a.trainNum > b.trainNum) ? 1 : -1)



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

	train_card.setAttribute("onclick", `viewTrain(${train_obj.trainNum}, ${train_obj.objectID})`);

	train_card.setAttribute("id", train_obj.objectID);

	train_card.innerHTML = inner_html;

	trains_holder.appendChild(train_card)
})

trains_holder.appendChild(addButton);

setInterval(function() {
    
}, 60 * 1000);

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function() {
		navigator.serviceWorker
			.register("/serviceWorker.js")
			.then(res => console.log("service worker registered"))
			.catch(err => console.log("service worker not registered", err))
	})
}