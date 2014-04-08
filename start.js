var fork = require("child_process").fork;

fork("coreMaster.js");
fork("coreSlave.js");
fork("mainCluster.js");