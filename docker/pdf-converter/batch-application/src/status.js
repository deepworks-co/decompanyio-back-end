var Status = function(){
    this.subprocess = []
    this.isStopping = false;
}


Status.prototype.addJob = function(jobId) {
    this.subprocess.push(jobId);
}

Status.prototype.removeJob = function(jobId) {
    this.subprocess = this.subprocess.filter((cur)=> cur !== jobId)
}

Status.prototype.stop = function() {
    this.isStopping = true;
}

Status.prototype.isStop = function() {
    return this.isStopping;
}


Status.prototype.jobCount = function() {
    return this.subprocess.length;
}

module.exports = Status;