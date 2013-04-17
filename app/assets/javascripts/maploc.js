/*      This is taken from the class homework files from mapscrip.  It is
*       being used as a reference in the project for future google earth
*       deployment and development.  Credit goes to Dr. Stephen Liddle 
*       and his scriptures.byu.edu application.  Thanks Dr. Liddle.
*/
/*------------------------------------------------------------------------
 *                      GOOGLE EARTH PLUGIN MANAGEMENT
 */
// Clear the old content and load new placemarks into Google Earth
clearOldAndLoadNewPlacemarks = function (oldDiv) {
    $(oldDiv).html('Loading...');
    $(window).scrollTop(0);

    if (ge) {
        setupPlacemarks();
    }
};

// Remove all placemarks from Google Earth
clearPlacemarks = function () {
    var feature, features;

    features = ge.getFeatures();
    feature = features.getFirstChild();

    while (feature) {
        features.removeChild(feature);
        feature = features.getFirstChild();
    }

    // Clear array of current placemarks
    gePlacemarks = [];
};

// Callback for failure to init Google Earth
failureCallback = function (errorCode) {
    // For now, we just ignore this
    console.log('Google Earth failure: ' + errorCode);
    ge = null;
};

// Lazy-load custom icon style
getIconStyle = function () {
    var icon, style;

    if (!iconStyle) {
        icon = ge.createIcon('');
        style = ge.createStyle('');
        icon.setHref('http://maps.google.com/mapfiles/kml/paddle/red-circle.png');
        style.getIconStyle().setIcon(icon);

        iconStyle = style;
    }

    return iconStyle;
};

// Initialize the Google Earth plugin
initGoogleEarth = function () {
    google.earth.createInstance("earth", initEarthCallback, failureCallback);
};

// Callback for successful initialization of Google Earth
initEarthCallback = function (instance) {
    ge = instance;

    // Load the extensions library
    gex = new GEarthExtensions(ge);

    // Make the window visible with navigation controls
    ge.getWindow().setVisibility(true);
    ge.getNavigationControl().setVisibility(ge.VISIBILITY_AUTO);

    // Show several of the possible informational layers
    ge.getOptions().setOverviewMapVisibility(true);
    ge.getOptions().setScaleLegendVisibility(true);
    ge.getOptions().setStatusBarVisibility(true);

    // Show borders
    ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, true);
};

// Test whether placemark is already in our array
placemarkExists = function (placename, latitude, longitude) {
    return ((getCurrentPlacemark(placename, latitude, longitude)) !== null)
};

getCurrentPlacemark = function (placename, latitude, longitude) {
    placename = placename || MS.currentLocation[1];
    latitude = latitude || MS.currentLocation[2];
    longitude = longitude || MS.currentLocation[3];
    var i, placemark;

    for (i = 0; i < gePlacemarks.length; i++) {
        placemark = gePlacemarks[i];

        if (placemark.getName() === placename &&
            placemark.getGeometry().getLatitude() - latitude < 0.0001 &&
            placemark.getGeometry().getLongitude() - longitude < 0.0001) {
            return placemark;
        }
    }

    return null;
};

// Place this chapter's placemarks into Google Earth and zoom to show all
setupPlacemarks = function () {
    
    if (gePlacemarks.length > 0) {
        clearPlacemarks();
    }

    $(visibleId + ' a[onclick^="showLocation("]').each(function() {
        var geotagId, latitude, longitude,
        matches, placename, point, value;

        value = this.getAttribute('onclick');

        matches = parseLatLon.exec(value);

        if (matches) {
            geotagId = matches[1];
            placename = matches[2];
            latitude = parseFloat(matches[3]);
            longitude = parseFloat(matches[4]);

            if (!placemarkExists(placename, latitude, longitude)) {
                // Create the placemark.
                var placemark = ge.createPlacemark('');

                // Set the placemark's location.  
                point = ge.createPoint('');
                point.setLatitude(latitude);
                point.setLongitude(longitude);
                placemark.setGeometry(point);
                placemark.setName(placename);
                placemark.setStyleSelector(getIconStyle());
                google.earth.addEventListener(placemark, 'click', function(event) {
                    // Prevent the default balloon from appearing.
                    event.preventDefault();

                    var balloon = ge.createHtmlStringBalloon('');
                    balloon.setFeature(placemark);
                    var description = 
                    '<h3>' + placemark.getName() + '</h3><div class="placemark-description">'+
                        '<button onclick="MS.showPlacemarkEditForm()" class="btn btn-primary btn-block"><i class="icon-edit icon-white"></i> Edit View</button>'+
                        '<button onclick="MS.suggestPlacemarkView()" class="btn btn-primary btn-block"><i class="icon-thumbs-up icon-white"></i> Suggest Current View</button>'+
                    '</div>';
                    balloon.setContentString(description);
                    ge.setBalloon(balloon);
                    MS.currentLocation = [parseFloat(matches[1]), matches[2], parseFloat(matches[3]),
                                       parseFloat(matches[4]), parseFloat(matches[5]), parseFloat(matches[6]),
                                       parseFloat(matches[7]), parseFloat(matches[8]), parseFloat(matches[9]),
                                       parseFloat(matches[10])];
                });

                // Cache the placemark in our placemarks list
                gePlacemarks.push(placemark);
            }
        }
    });

    if (gePlacemarks.length > 0) {
        var bounds, folder;

        if (gePlacemarks.length === 1 && matches) {
            // When there's exactly one placemark, add it and zoom to it
            ge.getFeatures().appendChild(gePlacemarks[0]);

            libraryObject.showLocation(matches[1], matches[2], matches[3],
                                       matches[4], matches[5], matches[6],
                                       matches[7], matches[8], matches[9],
                                       matches[10]);
        } else {
            folder = gex.dom.addFolder(gePlacemarks);
            bounds = gex.dom.computeBounds(folder);

            gex.view.setToBoundsView(bounds, {aspectRatio: 1.0});
        }
    }
};

showEarth = function () {
    $('#earthWrapper').show();

    if ($(window).width() <= 600) {
        $('#earth-close').show();
    } else {
        $('#earth-close').hide();
    }
};

// Show Google Maps version of placename
showMapLocation = function (placename, latitude, longitude) {
    /*
     * NEEDSWORK: this is a work in progress; I intend for this
     * eventually to supplement the GE plugin for devices or
     * browsers that can't run the GE plugin (e.g. iPads).
     */
    var height, width;

    width = $('#earth').outerWidth();
    height = $(window).height();

    $('#earth').html("<iframe width=\"" + width +
                     "\" height=\"" + height +
                     "\" frameborder=\"0\" scrolling=\"no\" " +
                     "marginheight=\"0\" marginwidth=\"0\" " +
                     "src=\"https://maps.google.com/maps?f=q" +
                     "&amp;source=s_q&amp;hl=en&amp;geocode=&amp;q=" + placename +
                     "&amp;aq=0&amp;oq=" + placename +
                     "&amp;sll=" +
                     latitude + "," + longitude +
                     "&amp;sspn=8.859086,10.546875&amp;t=h&amp;ie=UTF8&amp;hq=&amp;hnear=" +
                     placename + "&amp;ll=" +
                     latitude + "," + longitude +
                     "&amp;spn=0.09245,0.146255&amp;z=12&amp;iwloc=A&amp;output=embed\"></iframe>");
    // http://maps.google.com/?ll=%3.6f,%3.6f&spn=0.005,0.005&t=h&z=18&vpsrc=6
};

showCurrentLocation = function() {
    var camera, lookAt, geotagId, placename, latitude, longitude,
        viewLatitude, viewLongitude, viewTilt,
        viewRoll, viewAltitude, viewHeading;

    geotagId = MS.currentLocation[0];
    placename = MS.currentLocation[1];
    latitude = MS.currentLocation[2];
    longitude = MS.currentLocation[3];
    viewLatitude = MS.currentLocation[4];
    viewLongitude = MS.currentLocation[5];
    viewTilt = MS.currentLocation[6];
    viewRoll = MS.currentLocation[7];
    viewAltitude = MS.currentLocation[8];
    viewHeading = MS.currentLocation[9];

    if (!ge) {
        showMapLocation(placename, parseFloat(latitude), parseFloat(longitude));
    }

    showEarth();

    if (viewLatitude === undefined) {
        // Just show the requested point from 5000m
        lookAt = ge.createLookAt('');

        // Set new latitude and longitude values.
        lookAt.setLatitude(parseFloat(latitude));
        lookAt.setLongitude(parseFloat(longitude));
        lookAt.setRange(5000);

        // Update the view in Google Earth.
        ge.getView().setAbstractView(lookAt);
    } else {
        // Show the point from a given perspective
        camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);

        // Set new latitude and longitude values.
        camera.setLatitude(parseFloat(viewLatitude));
        camera.setLongitude(parseFloat(viewLongitude));
        camera.setTilt(parseFloat(viewTilt));
        camera.setRoll(parseFloat(viewRoll));
        camera.setAltitude(parseFloat(viewAltitude));
        camera.setHeading(parseFloat(viewHeading));

        // Update the view in Google Earth.
        ge.getView().setAbstractView(camera);
    }
};