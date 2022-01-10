const wait = ((delay) => {//milliseconds
    return new Promise((resolve) => setTimeout(resolve, delay));
})

const convertTZ = ((date, tzString) => {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
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

const stationView = (() => {

	let cssPlace = document.getElementById('modifier');
	let stationsArr = document.getElementById('station_selector').innerText.split('\n')
	let inner_html = '';
	let current = document.getElementById('station_selector').value;

	for (let i = 0; i < stationsArr.length; i++) {
		inner_html += `.${stationsArr[i]} {display: none;}`;
	}

	inner_html += `.${current} {display: flex;}`;

	cssPlace.innerHTML = inner_html;
})

let trains_holder = document.getElementById('trains_holder');

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statuses = {
    'Late': 'late',
    'Early': 'early',
    'On Time': 'on-time',
    'Completed': 'completed',
    'No Data': 'completed',
}

const wipeTrainBlocks = (() => {
    let trains = document.getElementsByClassName('trainButton');

    while (trains.length > 0) {
        trains[0].remove();
    }
})

const addTrainBlock = ((train_obj) => {
    
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

    let train_card = document.createElement('article');

    train_card.setAttribute("onclick", `addTrain(${train_obj.trainNum}, ${train_obj.objectID})`);

    let stations = train_obj.stations;

    train_card.classList.add('trainButton');
    train_card.classList.add(train_obj.objectID.toString());

    train_card.id = train_obj.objectID.toString();

    train_card.innerHTML = inner_html;

    trains_holder.appendChild(train_card)
})

//initial load, fill list
fetchRetry('https://api.amtraker.com/v1/trains', 100, 3, {
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

	Object.keys(data).forEach(async (key) => {
		data[key].forEach(async (train_obj) => {
            addTrainBlock(train_obj);
		})
	})

    let box = document.getElementById('searchBox');
    let trainButtons = document.getElementsByClassName('trainButton');

    const runSearch = (() => {

        let boxText = box.value;
        let inner_html = '';

        if (boxText != '') {
            const results = fuse.search(boxText);

            if (results.length > 0) {
                wipeTrainBlocks();
        
                let cssPlace = document.getElementById('modifier');
            	let inner_html = '.trainButtons {display: none;}';
        
                for (let i = 0; i < results.length; i++) {
                    addTrainBlock(results[i].item);
                }   
            }
        }
    })

    const trySearch = debounce(() => runSearch());
        
    box.addEventListener("keyup",(e) => {
        trySearch();
    });

    let dataList = [];
    let dataListBefore = Object.values(data);

    for (let i = 0; i < dataListBefore.length; i++) {
        for (let j = 0; j < dataListBefore[i].length; j++) {
            dataList.push(dataListBefore[i][j])
        }
    }
    
    const options = {
        includeScore: true,
         threshold: 0.4,
        keys: ['trainNum', 'routeName', 'aliases', 'stations.code', 'stations.stationName']
    }
    
    const dataIndex = Fuse.createIndex(options.keys, dataList)
    
    const fuse = new Fuse(dataList, options, dataIndex);
})

const addTrain = (async (trainNum, objectID) => {
	let data = await fetchRetry(`https://api.amtraker.com/v1/trains/${trainNum}`, 100, 3, {
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

function debounce(func, timeout = 200) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}