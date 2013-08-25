/** Traductor JS **/

// Storage detection

var DBname = "trada";
var storage = null;
var apertium_url = "http://www.softcatala.org/apertium";
//apertium_url = "http://api.apertium.org"
var sc_key = 'ZjI4NjFkYzZmOWU1NTdkOWUyOWE';
var apertium_key = '171Fr02FAPIe7NxKxQMGigu7oU4';

var api_key = sc_key;

var pairspath = "/json/listPairs";

// In the following line, you should include the prefixes of implementations you want to test.
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

// We go for indexedDB first, otherwise localStorage
if (window.indexedDB) {
	storage = "indexedDB";
} else {
	if (localStorage) {
		storage = "localStorage";
	} else {
		$("history-show").hide(); //Hide button of history
	}
}

// Migrate to IDB
$(document).ready(function() {
	migrateStorage("trada");
});


jQuery.fn.limitMaxlength = function(options){

	var settings = jQuery.extend({
		attribute: "maxlength",
		onLimit: function(){},
		onEdit: function(){}
	}, options);

	// Event handler to limit the textarea
	var onEdit = function(){
		var textarea = jQuery(this);
		var maxlength = parseInt(textarea.attr(settings.attribute), 10);

		if(textarea.val().length > maxlength){
			textarea.val(textarea.val().substr(0, maxlength));

			// Call the onlimit handler within the scope of the textarea
			jQuery.proxy(settings.onLimit, this)();
		}

		// Call the onEdit handler within the scope of the textarea
		jQuery.proxy(settings.onEdit, this)(maxlength - textarea.val().length);
	};

	this.each(onEdit);

	return this.keyup(onEdit)
		.keydown(onEdit)
		.focus(onEdit);
};

function SelectText(element) {
	var text = document.getElementById(element);
	var range;
	var selection;
	if (jQuery.browser.msie) {
		range = document.body.createTextRange();
		range.moveToElementText(text);
		range.select();
	} else if (jQuery.browser.mozilla || jQuery.browser.opera) {
		selection = window.getSelection();
		range = document.createRange();
		range.selectNodeContents(text);
		selection.removeAllRanges();
		selection.addRange(range);
	} else if (jQuery.browser.webkit || jQuery.browser.safari ) {
		selection = window.getSelection();
		selection.setBaseAndExtent(text, 0, text, 1);
	}
}


function nl2br(text){
	text=escape(text);
	return unescape(text.replace(/(%5Cr%5Cn)|(%5Cn%5Cr)|%0A|%5Cr|%5Cn/g,'<br />'));
}

setTimeout(avisSoftvalencia,10000);
document.apertium_loaded = false;
function avisSoftvalencia() {

	avis = 'Estem experimentant problemes tècnics.<br />Proveu d\'utilitzar <a href="http://www.softvalencia.org/traductor/">el traductor disponible a la web de Softvalencià</a> mentre els resolem.';

	// if(!document.apertium_loaded)
		jQuery('#avis_softvalencia').html(avis);
}

jQuery(document).ready(function() {
	// document.apertium_loaded = true;

	jQuery('#avis_softvalencia').hide();
	jQuery('#botons_traductor').show();
	if(typeof jQuery.proxy != 'undefined')
		jQuery('#sl').limitMaxlength();

	llistaparells();
	
	if (storage == 'indexedDB') {
		getLocalStorageID(DBname);
	} else {
		getLocalStorage(DBname);
	}

	jQuery(document).on("click", "button.translate", function(){
			var langpair = jQuery('#langpair option:selected').val().replace('-','|');

			var muk = (jQuery('#unknown:checked').length)?'yes':'no';

			var txt = jQuery('#sl').val();

			if(!txt.length) return false;
			
			// Let's clear translated text

			var checkurl = "http://www.softcatala.org/app/online.php";
                        $.ajax({
                                url:checkurl,
                                type:"GET",
                                dataType:"jsonp",
                                crossDomain: "true",
                                timeout:2000,
                                async:true,
                                success:function(data, status){
					$.ajax({
                                                url:apertium_url+"/json/translate", //URL of translator
                                                type:"POST",
                                                crossDomain: "true",
                                                timeout:2000,
                                                async:true,
                                                data : {'langpair':langpair,'q':txt,'markUnknown':muk,'key': api_key, callback:'trans'},
                                                dataType: 'jsonp',
                                                success : trad_ok,
                                                failure : trad_ko
                                        });
                                },
                                error:function(x, t, m){
					parells_ko();
				}
                        });


			return false;
	});

	jQuery('#form_proposta').submit(function(){
		var langpair = jQuery('#langpair option:selected').val();
		var orig = jQuery('#sl').val();
		
		var trad = jQuery('#traduccio').html();
		var prop = jQuery('#proposta').val();

		jQuery.ajax({
			url:"/nova_proposta.php",
			type:"POST",
			success: prop_ok,
			error: prop_ko,
			data: {'langpair':langpair,'original':orig,'traduccio':trad,'proposta':prop}
		});
		return false;
	});

	jQuery('#lk_proposta').click(function(){
		jQuery('#lk_proposta').hide(200);
		jQuery('#dv_proposta').show(200);
	});


	function trad_ko() {
		jQuery('#trad_info').html(': <span style="font-size:0.8em;color:red;font-weight:bold">ERROR EN LA TRADUCCIÓ</span>');
		jQuery('#traduccio').hide();
	}

	function trad_ok(dt) {
		if(dt.responseStatus==200) {
			//jQuery('#traduccio').html('<pre style"white-space: pre-wrap; word-wrap: break-word;">'+dt.responseData.translatedText+'</pre>');
			//jQuery('#traduccio').html(nl2br(dt.responseData.translatedText));
			jQuery('#traduccio').html(dt.responseData.translatedText);
			jQuery('#traduccio').val(dt.responseData.translatedText);
			jQuery('#traduccio').show();
			jQuery('#trad_info').html('');
			jQuery('#dv_traduccio').show(500);


			// Prepare stuff for storing
			var langpair = jQuery('#langpair option:selected').val();

			var unknown = false;
			if ( jQuery('#unknown:checked').length ) {
				unknown = true;
			}
			var txt = "";
			if ( jQuery('#sl').val().length > 0 ) {
				txt = jQuery('#sl').val();
			}
			var traduccio = "";

			if ( jQuery('#traduccio').val().length > 0 ) {
				traduccio = jQuery('#traduccio').val();
			}

			// Params for storage
			var msec = new Date().getTime();

			//Store locally last langpair
			
			var docSet = [];
			docSet.id = msec;
			docSet.langpair = langpair;
			docSet.unknown = unknown;
			docSet.txt = txt;
			docSet.traduccio = traduccio;

			storeDoc( DBname, docSet );
		
			var target_offset = jQuery("#dv_traduccio").offset();
			var target_top = target_offset.top;
			jQuery('html, body').animate({scrollTop:target_top}, 500);

			jQuery('.link_select span').click(function(){ SelectText('traduccio'); });
			
		} else {
				trad_ko();
		}
	}

	function prop_ok() {
		alert('Gracies pel vostre suggeriment');
	}

	function prop_ko() {
		alert('Hi ha hagut un error enviant la vostra proposta. Si voleu, torneu a intentar-ho.');
	}

	
	jQuery('#neteja').click(function(){
		jQuery('#sl').val('');
		jQuery('#dv_traduccio').hide(500);
		jQuery('#traduccio').html('');
	});

	jQuery('#sl').focus();

	
});

jQuery(document).on('click', ".select", function() {
	var splitkey = jQuery(this).attr('id').split('-', 2);
	var doc = splitkey[1];
	
	if (storage == 'indexedDB') {
		
		getAllItemsID(function (docSet) {
			
			//Put used params
			if (docSet.langpair !== '') {
				jQuery('#langpair').val(docSet.langpair);
			}
			
			// Default true
			if (docSet.unknown == 'false') {
				jQuery('#unknown').attr('checked', false);
			} else {
				jQuery('#unknown').attr('checked', true);
			}
			
			if (docSet.txt !== '') {
				jQuery('#sl').val(docSet.txt);
			}
			if (docSet.traduccio !== '') {
				jQuery('#traduccio').html(docSet.traduccio);
				jQuery('#traduccio').val(docSet.traduccio);
				$("section").hide();
				jQuery('#trad_info').html('');
				$("#traductor").show();
				//jQuery('#traduccio').show();
				jQuery('#dv_traduccio').show(500);
			}
			
		}, DBname, doc);
		
	} else {
	
		var docSet = getAllItems(DBname, doc);
		
		//Put used params
		if (docSet.langpair !== '') {
			jQuery('#langpair').val(docSet.langpair);
		}
		
		// Default true
		if (docSet.unknown == 'false') {
			jQuery('#unknown').attr('checked', false);
		} else {
			jQuery('#unknown').attr('checked', true);
		}
		
		if (docSet.txt !== '') {
			jQuery('#sl').val(docSet.txt);
		}
		if (docSet.traduccio !== '') {
			jQuery('#traduccio').html(docSet.traduccio);
			jQuery('#traduccio').val(docSet.traduccio);
			$("section").hide();
			jQuery('#trad_info').html('');
			$("#traductor").show();
			//jQuery('#traduccio').show();
			jQuery('#dv_traduccio').show(500);
		}
	}
});


jQuery(document).on('click', ".remove", function() {
	var splitkey = jQuery(this).attr('id').split('-', 2);
	var doc = splitkey[1];

	if (storage == 'indexedDB') {
		clearStorageID(DBname, doc);
	} else {
		clearStorage(DBname, doc);
	}
	
	jQuery(this).parent().parent().remove();
});


jQuery(document).on('click', "button.clean-all", function() {
	//Remove storage with certain prefix
	
	if (storage == 'indexedDB') {
		clearStorageID(DBname);
	} else {
		clearStorage(DBname);
	}
	jQuery('#historial .list').hide();
	$('#historial .list > *').remove();
	jQuery('#historial .list').show();

});


// Show
jQuery(document).on('click', ".main-show", function() {
	$("section").hide();
	$("#traductor").show();
});
jQuery(document).on('click', ".settings-show", function() {
	$("section").hide();
	$("#opcions").show();
});
jQuery(document).on('click', ".history-show", function() {
	$("section").hide();
	$("#historial").show();
});

jQuery(document).on('click', "#up", function() {
	var target_offset = jQuery("#main-header").offset();
	var target_top = target_offset.top;
	jQuery('html, body').animate({scrollTop:target_top}, 500);

});

// Check if you can get connection for all langpairs
jQuery(document).on('click', null, function() {

	if ( ! $("#langpair").hasClass("complete")) {
		llistaparells();
	}

});


function sortObj(arr){
	// Setup Arrays
	var sortedKeys = [];
	var sortedObj = {};

	// Separate keys and sort them
	for (var i in arr){
		sortedKeys.push(i);
	}
	sortedKeys.sort();

	// Reconstruct sorted obj based on keys
	for (var h in sortedKeys){
		sortedObj[sortedKeys[h]] = arr[sortedKeys[h]];
	}
	return sortedObj;
}

function getLocalStorage(db) {

	numeric_array = [];
	numeric_array = getAllItems(db);
	
	lastSaved = [];
	lastSaved = numeric_array[(numeric_array.length -1)];
	

	//Put last used language
	if (lastSaved) {
		if (lastSaved.langpair) {
			jQuery('#langpair').val(lastSaved.langpair);
		}
		// Default true
		if (lastSaved.unknown == 'false') {
			jQuery('#unknown').attr('checked', false);
		} else {
			jQuery('#unknown').attr('checked', true);
		}
	}

	//Remove previous
	$('#historial .list > *').remove();
	
        //Fill history div
        for (var item in numeric_array.reverse()){
                //Limit size of string
	
		if ( numeric_array[item].txt ) {
			var txt2show = numeric_array[item].txt.substr(0, 25) + "...";
			
			var string = '<p class="histitem"><a href="#" class="select" id="select-'+numeric_array[item].id+'"><img src="style/images/select.png" alt="Select" title="Select" /></a><span class="txt"><a href="#" class="select" id="selecta-'+numeric_array[item].id+'">'+txt2show+'</a></span><a href="#history" class="remove" id="remove-'+numeric_array[item].id+'"><img class="remove" id="remove-'+numeric_array[item].id+'" src="style/images/remove.gif" alt="Remove" title="Remove" /></a></p>';
			jQuery('#historial .list').append(string);
		}
        }
}

function getLocalStorageID(db) {
	
	getAllItemsID(function (result_array) { // value is now passed as a parameter
		
		//Remove previous
		$('#historial .list > *').remove();
		
		var objkeys = [];
		
		for (var k in result_array) {
			if (result_array.hasOwnProperty(k)) {
				objkeys.push(k);
			}
		}
		
		objkeys.sort();
		
		//Last Saved pending
		if (objkeys.length > 0) {
			var lastkey =  objkeys[(objkeys.length -1)];
			if (result_array[lastkey].langpair) {
				jQuery('#langpair').val(result_array[lastkey].langpair);
			}
			// Default true
			if (result_array[lastkey].unknown == 'false') {
				jQuery('#unknown').attr('checked', false);
			} else {
				jQuery('#unknown').attr('checked', true);
			}
			
		}
		
		//Fill history div
		for (var item in objkeys.reverse()){
			//Limit size of string
			var objkey = objkeys[item];
			if ( result_array[objkey].txt ) {
				var txt2show = result_array[objkey].txt.substr(0, 25) + "...";
			
				var string = '<p class="histitem"><a href="#" class="select" id="select-'+result_array[objkey].id+'"><img src="style/images/select.png" alt="Select" title="Select" /></a>';
				string+='<span class="txt"><a href="#" class="select" id="selecta-'+result_array[objkey].id+'">'+txt2show+'</a></span>';
				string+='<a href="#history" class="remove" id="remove-'+result_array[objkey].id+'"><img class="remove" id="remove-'+result_array[objkey].id+'" src="style/images/remove.gif" alt="Remove" title="Remove" /></a></p>';
				jQuery('#historial .list').append(string);
			}
		}
	
	}, db);
	
}


function clearStorage(db, doc) {

	var toRemove = [];
	
	if (localStorage) {
		//Assumes there is prefix - separated;
		for (i=0; i<=localStorage.length-1; i++)  {
			// get the key
			key = localStorage.key(i);
			// split the key
			var splitkey = key.split('-', 3);
			var prefix = splitkey[0];
			var base = splitkey[1];
			if (doc !== null ) {
				if ((prefix == db) && (base == doc)) { //Only remove if prefix
					toRemove.push(key);
				}
			}
			else {
				if (prefix == db) { //Only remove if prefix
					toRemove.push(key);
				}
			}
		}
	
		// Remove actual values
		for (a=0; a<=toRemove.length-1; a++) {
			localStorage.removeItem(toRemove[a]);
		}
	
	}
}

function clearStorageID(db, doc) {
	
	if (storage == 'indexedDB') {
	
		if (doc !== null) {
			
			pouchdb = Pouch('idb://'+db, function(err, dbh) {
			if (err) {
				console.log(err);
			}
			else {
				dbh.get(doc.toString(), function(err, docid) {
				dbh.remove(docid, function(err, response) {

				}); });
			}
			});
		}
		
		else {
			Pouch.destroy('idb://'+db, function(err, info) {
				if (err) {
					console.log(err);
				}
			// database deleted
			});
			
		}
	}
}


function storeDoc(db, docSet) {
	
	if (storage == 'indexedDB') {
		
		if ( docSet.id ) {
			
			pouchdb = Pouch('idb://'+db, function(err, dbh) {
			if (err) {
				console.log(err);
			}
			else {
				// Get last saved
				getAllItemsID(function (result_array) {
					// Integrate what's below here
					
					
					var objkeys = [];
		
					for (var k in result_array) {
						if (result_array.hasOwnProperty(k)) {
							objkeys.push(k);
						}
					}
		
					objkeys.sort();
					
					//Save default
					go = true;
					//Last Saved pending
					if (objkeys.length > 0) {
						var lastkey =  objkeys[(objkeys.length -1)];
						
						if ( ( result_array[lastkey].txt == docSet.txt ) && ( result_array[lastkey].traduccio == docSet.traduccio )  ) {
							// If exists don't save
							go = false;
						}
					}
					
					if (go) {
						// Turn id to string is required
						dbh.put({ _id: docSet.id.toString(), langpair: docSet.langpair, unknown: docSet.unknown, txt: docSet.txt, traduccio: docSet.traduccio }, function(err, response) {
						if (err) {
							console.log(err);
						}
						
						// Refresh view
						getLocalStorageID(db);
						
						});
					}
					
				}, db);	
				
			}
			});
		}
	} else {
	if (localStorage) {

		// Let's play with object
		if ( docSet.id ) {

			//get all values
			numeric_array = getAllItems(db);
			
			var go = true;
			
			// Get last saved
			if ( numeric_array.length > 0 ) {
				lastSaved = numeric_array[(numeric_array.length -1)];
				if ( ( lastSaved.txt == docSet.txt ) && ( lastSaved.traduccio == docSet.traduccio ) ) {
					go = false;
				}
			}
			
			//We checked if the same as last one
			if ( go ) {
								
				doc = docSet.id;
	
				for (var key in docSet) {
	
					if (key != 'id') {
	
						value = docSet[key];
						localStorage.setItem(db+"-"+doc+"-"+key, value );
					}
				}
	
				//TODO -> limit 25?
				limitarray = 25;
				while ( numeric_array.length > limitarray ) {
					clearStorage(DBname, numeric_array[numeric_array.length -1].id);
					numeric_array.pop();
				}
				
				getLocalStorage(db);

			}
		}

	} }
}


function getAllItems(db, docSet) {
	
	var localSaved = [];
	var numeric_array = [];
	
	if (localStorage) {
		if (localStorage.length > 0) {
			//First get all localstore into in array
			for (i=0; i<=localStorage.length-1; i++)  {
				// get the key
				key = localStorage.key(i);
				// split the key
				var splitkey = key.split('-', 3);
				var prefix = splitkey[0];
				if (prefix == db) { //Only save if prefix
					var base = splitkey[1];
					var attr = splitkey[2];

					if (docSet === null) {
						// Two dimensions
						if (!localSaved[base]) {
							localSaved[base] = [];
							localSaved[base].id = base;
						}
						localSaved[base][attr] = localStorage.getItem(key);
					
					} 
					else {
						if ( base === docSet ) {
							// One dimension
							localSaved[attr] = localStorage.getItem(key);
							localSaved.id = base;
						}
						
					}
				}
			}
		}
	}
	
	if (docSet === null) {
		//Now sort array
		for (var item in sortObj(localSaved)){
			numeric_array.push( localSaved[item] );
		}
	}
	else {
		numeric_array = localSaved;
	}

	return numeric_array;
	
}

function getAllItemsID(callback, db, docSet) {
	
	if (storage == 'indexedDB') {
		pouchdb = Pouch('idb://'+db, function(err, dbh) {
		if (err) {
			console.log(err);
		}
		else {
			if (docSet === null ) {
				dbh.allDocs(function(err, response) {
					if (err) {
						console.log(err);
					}
					else {
						var IDSaved = {};
						
						//If empty, start, return
						if (response.rows.length === 0) {
							callback(IDSaved);
						}
						
						for (var row in response.rows) {
							dbh.get(response.rows.row.id, function(err, docArr) {
								if (err) {
									console.log(err);
								}
								else {
									var docid = docArr._id;
									
									if (! IDSaved[docid]) {
										IDSaved[docid] = {};
									}
									
									IDSaved[docid].id = docid;
									for (var attr in docArr) {
										if (attr.indexOf("_") !== 0) {
											IDSaved[docid][attr] = docArr[attr];
										}
									}
									
									if (Object.keys(IDSaved).length >= response.total_rows) {
										
										callback(IDSaved);
									}
								}
							});
						}
					}
				});
			}
			else {
				dbh.get(docSet, function(err, docArr) {
					if (err) {
						console.log(err);
					}
					else {
						var IDSaved = {};
						IDSaved.id = docSet;
						for (var attr in docArr) {
							if (attr.indexOf("_") !== 0) {
								IDSaved[attr] = docArr[attr];
							}
						}
						callback(IDSaved);
					}
				});
			}
		}
		});	
	}
}

function migrateStorage(db) {
	
	if (storage == 'indexedDB') {
		
		if (localStorage) {
			var content = getAllItems(db);
					
			for (var item in content.reverse()){
												
				//Store items
				storeDoc("trada", content[item]);
			}
			// Clean all
			clearStorage(db);
			
		}
	}
}

function llistaparells() {

	$.ajax({
		url:apertium_url+pairspath, //URL of translator
		type:"GET",
		crossDomain: "true",
		data : { key: api_key},
		dataType: 'jsonp',
		success : parells_ok,
		failure : parells_ko
	});


}

function parells_ok(dt){
	
	if(dt.responseStatus==200) {
		
		var numdt = dt.responseData.length; // Check if finished
		
		$.each(dt.responseData, function(index, value) {
						
			// Fill pairs here. Translate pairs lang
			var sourceLanguage = value.sourceLanguage;
			var targetLanguage = value.targetLanguage;
			var trans = sourceLanguage+"-"+targetLanguage;
			var str = _(sourceLanguage.replace("_","-"))+" » "+_(targetLanguage.replace("_","-"));
			
			if ($('#langpair option[value='+trans+']').length === 0 ) {
				$("#langpair").append("<option value='"+trans+"'>"+str+"</option>");
			}
			
			numdt--;
			if ( numdt === 0 ) {
				$("#langpair").addClass("complete");	
			}
		});
		

	} else {
		parells_ko();
	}
}

function parells_ko(dt) {

	$('#warninternet').append('<p data-l10n-id="no_connection">No connection!</p>');
	$('#warninternet').show();
	
	setTimeout(function() {  $("#warninternet").hide(); $("#warninternet").empty(); }, 5000); 
	
}

window.addEventListener('localized', function() {
  document.documentElement.lang = document.webL10n.getLanguage();
  document.documentElement.dir = document.webL10n.getDirection();
  
  
}, false);

$(window).load(function() {
	
	// If no Firefox, for now, don't even show install button
	if(navigator.userAgent.toLowerCase().indexOf('firefox') < 0) {
		$('#install').hide();
		AddGoogleAd();
	} else {
		RemoveGoogleAd();
	}
	
	parells_l10n();

	// Check update webapp
	checkupdate();
});

// If other origin
$("#sourcepair").change(function() {

	$("#sourcepair option:selected").each(function () {
		apertium_url = $(this).attr('value');
		
		if ($(this).text == 'Apertium') {
			api_key = apertium_key;
		} else {
			api_key = sc_key;
		}
		
		llistaparells();
	});
	
});


function parells_l10n() {
	
	var _ = document.webL10n.get;
	
	$('#langpair option').each(function(index, option) {
		
		var langs = $(option).attr("value").split("-");
		var str = _(langs[0].replace("_","-"))+" » "+_(langs[1].replace("_","-"));
		
		if ( str === " » " ) {
			str = langs[0].replace("_","-")+" » "+langs[1].replace("_","-");
		}
		
		// Avoid empty names
		if (str !== " » ") {
			$(option).empty();
			$(option).append(str);
		}
	
	});
	
	// Sorting once we have everything http://stackoverflow.com/questions/45888/what-is-the-most-efficient-way-to-sort-an-html-selects-options-by-value-while
	$('#langpair').sort_select_box();
	
}

$.fn.sort_select_box = function(){
    // Get options from select box
    var my_options = $("#" + this.attr('id') + ' option');
    // sort alphabetically
    my_options.sort(function(a,b) {
        if (a.text > b.text) return 1;
        else if (a.text < b.text) return -1;
        else return 0;
    });
   //replace with sorted my_options;
   $(this).empty().append( my_options );

   // clearing any selections
   $("#"+this.attr('id')+" option").attr('selected', false);
};




function install(){

	if (!window.location.origin) {
		window.location.origin = window.location.protocol+"//"+window.location.host;
	}
	navigator.mozApps.install(window.location.origin+"/manifest.webapp");
	checkupdate();
	return false;
}
document.getElementById("install").onsubmit = install;

//jQuery(document).on('click', "#update-btn", function() {
//	
//	var appCache = window.applicationCache;
//	appCache.update(); // Attempt to update the user's cache.
//	appCache.swapCache();  // The fetch was successful, swap in the new cache.
//	
//	
//	window.location.reload();
//	$("#warninternet").hide();
//	
//	return false;
//	
//});


function checkupdate() {
	var request = window.navigator.mozApps.getInstalled();

	request.onerror = function(e) {
		console.error("Error calling getInstalled: " + request.error.name);
		$("#install").hide();
		AddGoogleAd();
	};
	request.onsuccess = function(e) {
		
	if (request.result.length === 1) {
		
		$("#install").hide(); // No need to show install
		$("#ad").hide(); // Remove ad in installed app
		
		var appsRecord = request.result;
		var installedVersion = appsRecord[0].manifest.version;
		var manifestURL = appsRecord[0].manifestURL;
		$.getJSON(manifestURL, function(data) {
			if (data.version != installedVersion ) {
				//console.log(data.version);
				//console.log(installedVersion);
				//var update = '<button id="update-btn" data-l10n-id="update">Update available</button>';
				//$("#warninternet").append(update);
				//$("#warninternet").show();
				var appCache = window.applicationCache;
				console.log("Updating app");
				console.log("Installed "+installedVersion+"; Available "+data.version);
				
				//appCache.update(); // Attempt to update the user's cache.
				//if (appCache.status == window.applicationCache.UPDATEREADY) {
				//	console.log("Now forcing update");
				//	appCache.swapCache();  // The fetch was successful, swap in the new cache.
				//}
				appsRecord[0].checkForUpdate(); // Update
								
			} 
		});

		RemoveGoogleAd();

	} else { AddGoogleAd(); }
	};
	
}

function AddGoogleAd() {
	if ( $("#ad").length > 0 ) {
		$("#ad").show();
	}
}

function RemoveGoogleAd() {
	if ( $("#ad").length > 0 ) {
		$("#ad").remove();
	}
}


//// WebActivities
//$("#traduccio").click(function(event) {
//        event.preventDefault();
//	var msg = new Array("example@example.com", "Traductor", $("#traduccio").val());
//	var sms = new MozActivity({
//                name: "new", // Possible compose-sms in future versions
//                data: {
//                    type: "mail",
//                    url: msg
//                }
//        });
//        
//});

