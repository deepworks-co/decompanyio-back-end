
stage = "$1"

if [ $1 = "-s" ];then
    #sls deploy $@
    echo stage
else
    echo 'stage : ' $@
fi

