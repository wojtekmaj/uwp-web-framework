/* Helpers */
Element.prototype.prependChild = function(child) { this.insertBefore(child, this.firstChild); };

Element.prototype.insertAfter = function(newNode, referenceNode) {
    return referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

function toArray(obj) { if(obj) return Array.prototype.slice.call(obj); }



/* Define UWP namespace */
var UWP = {};


/* Main init function */
UWP.init = function(params) {
	console.log('UWP.init()');
	
	/* Define most important elements */
	UWP.header = document.querySelector('header');
	UWP.header.type = UWP.config.headerType;
	UWP.header.setAttribute('data-style', UWP.header.type);
	
	UWP.main = document.querySelector('main');

	/* A little cleanup */
	UWP.header.innerHTML = '';
	UWP.main.innerHTML = '';
		
	/* Prepares space for document's title, puts it in place */
	if(UWP.header.type === 'pane') {
		UWP.pageTitle = document.createElement('span');
		
		UWP.header.prependChild(UWP.pageTitle);
	}
	
	UWP.getNavigation();
	UWP.navigate();
}



/* Gets document's navigation, puts it in place */
UWP.getConfig = function() {
	console.log('UWP.getConfig()');
	
	var URL = 'config/config.xml';
	
	var UWP_config_request = new XMLHttpRequest();
	UWP_config_request.onreadystatechange = function() {
		if(UWP_config_request.readyState == 4) {
			if(UWP_config_request.status == 200) {
				if(UWP_config_request.responseXML) {
					var headerType = UWP_config_request.responseXML.querySelector('mainMenu')
				}
				else {
					console.error('Invalid response.');
				}
			}
			else {
				console.error('Failed to retrieve config file.')
			}
		}
	}
	UWP_config_request.open('GET', URL, true);
	UWP_config_request.send(null);
};



/* Gets document's navigation, puts it in place */
UWP.getNavigation = function() {
	console.log('UWP.getNavigation()');
	
	function parseNavElement(el) {
		var navLabel = el.querySelector('label').textContent;
		var navTarget = el.querySelector('target').textContent;
		var navIconSource = el.querySelector('icon');
		
		var navElement = document.createElement('li');
		
		var navLink = document.createElement('a');
		navLink.href = '#'
		navLink.innerHTML = navLabel;
		if(navIconSource) {
			var navIcon = document.createElement('span');
			
			/* If that's a file, we'll create an img object with src pointed to it */
			if(/\.(jpg|png|gif|svg)/.test(navIconSource.textContent)) {
				// TODO
			}
			/* ...otherwise, it must be Segoe MDL2 symbol */
			else {
				navIcon.innerHTML = navIconSource.textContent;
			}
			
			navLink.prependChild(navIcon);
		}
		navLink.addEventListener('click', function(event) {
			event.preventDefault();
			
			UWP.navigate(navTarget);
		});
		navLink.setAttribute('data-target', navTarget)
		
		navElement.appendChild(navLink)
		
		return navElement;
	}
	
	var URL = 'nav/nav.xml';
	
	var UWP_navigation_request = new XMLHttpRequest();
	UWP_navigation_request.onreadystatechange = function() {
		if(UWP_navigation_request.readyState == 4) {
			if(UWP_navigation_request.status == 200) {
				if(UWP_navigation_request.responseXML) {
					var navsSource = UWP_navigation_request.responseXML.querySelector('mainMenu');
					
					var nav = document.createElement('nav');
					
					/* Adds all the navigations to the DOM tree */
					toArray(navsSource.querySelectorAll('nav')).forEach(function(navSource) {
						var navMain = document.createElement('ul');
						nav.appendChild(navMain);
						toArray(navSource.querySelectorAll('el')).forEach(function(el) {
							navMain.appendChild(parseNavElement(el));
						});
					});
					
					/* If navigation was constructed, adds it to the DOM tree and displays menu button */
					if(toArray(navsSource.querySelectorAll('nav')).length) {
						UWP.header.appendChild(nav);
						UWP.addMenuButton();
					}
				}
				else {
					console.error('Invalid response.');
				}
			}
			else {
				console.error('Failed to retrieve navigation file.')
			}
		}
	}
	UWP_navigation_request.open('GET', URL, true);
	UWP_navigation_request.send(null);
};

/* Puts a menu button in title bar */
UWP.addMenuButton = function() {
	console.log('UWP.addMenuButton()');
	
	if(UWP.header.type === 'pane') {
		UWP.menuButton = document.createElement('button');
		UWP.menuButton.innerHTML = '&#xE700;';
		UWP.menuButton.setAttribute('aria-label', 'Menu');
		UWP.menuButton.classList.add('mdl2');
		
		UWP.menuList = UWP.header.querySelector('header nav');
		
		UWP.header.addEventListener('click', function() {
			UWP.menuList.classList.toggle('active');
		});
		
		UWP.main.addEventListener('click', function() {
			UWP.menuList.classList.remove('active');
		});
		
		UWP.header.prependChild(UWP.menuButton);
	}
};

/* Puts content in place */
UWP.navigate = function(target) {
	console.log('UWP.navigate()');
	
	if(typeof target === 'undefined')
		target = 'default';
		
	UWP.config.currentPage = target;
		
	UWP.main.classList.remove('error');
	UWP.main.innerHTML = '';
		
	var URL = 'pages/' + target + '.xml';
	
	var UWP_navigate_request = new XMLHttpRequest();
	UWP_navigate_request.onreadystatechange = function() {
		if(UWP_navigate_request.readyState == 4) {
			if(UWP_navigate_request.status == 200) {
				if(UWP_navigate_request.responseXML) {
					var page = UWP_navigate_request.responseXML.querySelector('page');
					var pageTitle = page.querySelector('title').textContent;
					var pageBody = toArray(page.querySelector('body').childNodes).filter(function(childNode) {
						return childNode.nodeType === 4;
					})[0].data;
					
					/* Puts the new content in place */
					UWP.main.innerHTML = pageBody;
					
					/* Puts the new page title in place */
					UWP.pageTitle.innerHTML = pageTitle;
					
					/* Highlights current page */
					toArray(document.querySelectorAll('nav a')).forEach(function(link) {
						if(link.getAttribute('data-target') == UWP.config.currentPage)
							link.parentElement.classList.add('active');
						else
							link.parentElement.classList.remove('active');
					});
				}
				else {
					console.error('Invalid response.');
				}
			}
			else {
				console.error('Failed to retrieve the requested page.');
				
				UWP.main.classList.add('error');
				UWP.main.innerHTML = '<h3>Check connection</h3><p>Looking good?</p><p><a href="#">Try again</a>'
				UWP.main.querySelector('a').addEventListener('click', function(event) {
					event.preventDefault();
					
					UWP.navigate(target);
				});
			}
		}
	}
	UWP_navigate_request.open('GET', URL, true);
	UWP_navigate_request.send(null);	
};