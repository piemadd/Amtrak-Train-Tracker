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

//initial load, fill list
fetchRetry('https://api.amtrak.cc/v1/trains', 100, 3, {
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
}).then(response => response.json()).then(async (data) => {
	let trains_holder = document.getElementById('trains_holder');

	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	const statuses = {
		'Late': 'late',
		'Early': 'early',
		'On Time': 'on-time',
		'Completed': 'completed',
		'No Data': 'completed',
	}

	Object.keys(data).forEach(async (key) => {
		data[key].forEach(async (train_obj) => {

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
				<p class='route'>${months[sch_dep_obj.getMonth()]} ${sch_dep_obj.getDate()}, ${sch_dep_obj.getFullYear()} - ${train_obj.origCode} --> ${train_obj.destCode}</p>
				<p class='route'><span class='tag'>Current Speed: </span>${train_obj.velocity.toFixed(2)} mph</p>
				<p class='location'><span class='tag'>Current Destination:</span> ${train_obj.eventCode}</p>
			</div>

			<div class='number${font_change}'>${train_obj.trainNum}</div>`;

			let train_card = document.createElement('article');

			train_card.setAttribute("onclick", `addTrain(${train_obj.trainNum}, ${train_obj.objectID})`);

			//train_card.setAttribute("id", train_obj.);

			train_card.innerHTML = inner_html;

			trains_holder.appendChild(train_card)
		})
	})
})

const addTrain = (async (trainNum, objectID) => {
	let data = await fetchRetry(`https://api.amtrak.cc/v1/trains/${trainNum}`, 100, 3, {
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
	//why am i not using forEach? cuz ur mom
	for (let i = 0; i < data.length; i++) {
		if (data[i].objectID == objectID) {
			localStorage.setItem(`train_${objectID}`, JSON.stringify(data[i]));
			break;
		}
	}
	window.location.href = "/";
})