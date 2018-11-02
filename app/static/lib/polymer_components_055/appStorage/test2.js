(function(key, value) {
    //
    // SET
    //
    appStorage({"key": key, "value": value}, "set", function() {
    	//
        // GET
        //
        appStorage(key, "get", function() {
        	//
            // REMOVE
            //
            appStorage(key, "remove")
        });
    });
})("test2", [{"name": "daiki"}, 2, "test"]);