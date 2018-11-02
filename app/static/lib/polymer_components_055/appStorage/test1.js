(function(key, value) {
    //
    // SET
    //
    appStorage({"key": key, "value": value}, "set", function(item, keys) {
    	//
        // GET
        //
        appStorage({"key": keys[0]}, "get", function(item, keys) {
        	//
            // REMOVE
            //
            appStorage({"key": keys[0]}, "remove")
        });
    });
})("test1", [{"name": ["da","iz"]}, 1, "test"]);