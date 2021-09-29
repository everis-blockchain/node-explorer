import {TableCell, TablePagination } from '@material-ui/core';
import ForwardIcon from '@material-ui/icons/Forward';
import React, { Component } from 'react';
import {Column, PageHeader, Row, Drawer, Button, Container, InputLabel, Option, Select, TextInput, TooltipWrapper, FormGroup, Card} from '@r3/r3-tooling-design-system';
import { connect } from 'react-redux';
import * as ActionType from '../store/Actions';
import '../styles/Transaction.scss';

class TransactionExplorer extends Component{
    state = {
        page: {
            pageSize: 10,
            offset: 0
        },
        flowInfo: {},
        selectedFlow: {},
        trnxDetail: [],
        paramList: [],
        isOpen:false,
    }

    handleClose = () => {
        this.setState({paramList: [], selectedFlow: {}})
        this.props.loadFlowParams([]);
        this.props.closeTxModal();
    }

    handleOpen = () => {
        this.props.openTxModal();
        this.props.loadFlowParams([]);
    }

    constructor(props){
        super(props);
        props.fetchFlowList();
        props.fetchTrnxList(this.state.page);
        props.fetchParties();
    }

    handleFlowSelection = (event) => {
        for(var i=0; i<this.props.registeredFlows.length;i++){
            const flow = this.props.registeredFlows[i];
            if(flow.flowName === event.target.value){
                this.props.loadFlowParams(flow.flowParamsMap.Constructor_1);
                this.setState({
                    selectedFlow: {
                        name: event.target.value,
                        constructors: flow.flowParamsMap,
                        activeConstructor: 'Constructor_1'
                    }
                });
                break;
            }
        }
        this.props.setFlowSelectionFlag();
    }

    handleFlowConstructorSelection = (event) => {   
        this.props.loadFlowParams(this.state.selectedFlow.constructors[event.target.value]);
        this.setState({
            selectedFlow: {
                name: this.state.selectedFlow.name,
                constructors: this.state.selectedFlow.constructors,
                activeConstructor: event.target.value
            }
        });
    }


    handleChangePage = (event, newPage) => {

        this.setState({
            page: {
                pageSize: 10,
                offset: newPage
            },
            trnxDetail: []
        }, this.loadNewPage);
        
    }

    loadNewPage = () => {
        this.props.fetchTrnxList(this.state.page);
    }

    handleChangeRowsPerPage = (event) => {
        this.setState({
            page: {
                pageSize: event.target.value,
                offset: 0
            },
            trnxDetail: []
        }, this.loadNewPage);
    }

    prepareFlowDataToStart = () => {
        this.props.inFlightFLow(true);
        this.setState({
            flowInfo: {
                flowName: this.state.selectedFlow.name,
                flowParams: this.props.flowParams
            },
        }, () => this.props.startFlow(this.state.flowInfo));
    }

    showTrnxDetails = (trnx, index) => {
        let txDetail = this.state.trnxDetail;
        txDetail[index] = !this.state.trnxDetail[index]
        this.setState({
            trnxDetail: txDetail,
            isOpen:true
        });
    }

    renderJson = (jsonObj, lvl) => {
        return(
            Object.keys(jsonObj).map((key, index) => {
                return (
                    jsonObj[key] ?
                    <div key={index} style={{marginLeft: lvl * 15, paddingBottom: lvl === 0?5:0}}>
                        {lvl === 0?
                        <span><strong>{key}: &nbsp;</strong></span>
                        :
                        <span>{key}: &nbsp;</span>
                        }

                        {typeof jsonObj[key] === 'object'?
                            this.renderJson(jsonObj[key], lvl+1)
                        :
                        jsonObj[key]}
                    </div>:null
                )
            }) 
        )
    }

    renderParamForm(innerForm, paramList, title, deep, delIdx, param, key){
        return(
            <React.Fragment>
            {
                innerForm? 
                    <div className="inner-form" key={key}>
                        {
                            delIdx>=0?<div className="inner-form-close" onClick={()=> this.updateCmplxListParam(param, false, delIdx)}>X</div>:null
                        }
                   
                            <div className="custom-form-header"><h6>{title}</h6></div>
                            {
                                paramList.map((param, index) => this.renderInnerForm(param, index, true))
                            }
                     
                    </div>
                :
                this.props.flowParams?this.props.flowParams.map((param, index) => this.renderInnerForm(param, index, false)):null
            }
            </React.Fragment>
        );
    }

    renderInnerForm(param, index, deep){
        return(
            param.flowParams && param.flowParams.length > 1 && !(param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set'))? 
                this.renderParamForm(true, param.flowParams, param.paramName, deep)
            : // List of complex object
            param.flowParams && param.flowParams.length > 1 && (param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set'))? 
                <React.Fragment>
                    {/* {
                        this.renderParamForm(true, param.paramValue[0].params, param.paramName, deep, -1, param, -1)
                    }
                    {
                        this.state.paramList[param.paramName]?
                        this.state.paramList[param.paramName].map((value, idx) => {
                            return this.renderParamForm(true, value.params, param.paramName, deep, idx, param, value.key)
                        }):null
                    }
                    <div style={{cursor: "pointer"}} onClick={()=> this.updateCmplxListParam(param, true)}>Add</div> */}
                    <div style={{color: 'red', marginTop: 10}}>List of Complex Object is not supported</div>
                </React.Fragment>
            :
            <React.Fragment>   
            <div key={index}>
                {
                param.paramType === 'net.corda.core.identity.Party'?
         
                        <FormGroup fullWidth>
                            
                                <Select label={param.paramName} onChange={e => {param.paramValue = e.target.value}} autoWidth  helpText="Select Party">
                                    {
                                        this.props.parties.map((party, index) => {
                                            return(
                                                <Option key={index} value={party}>{party}</Option>
                                            );
                                        })
                                    }
                                </Select>                              
                            </FormGroup>
        
                :
                param.paramType === 'java.time.LocalDateTime' || param.paramType === 'java.time.Instant'?
                    <div>
                        <TextInput type="datetime-local" onBlur={e=> {param.paramValue = e.target.value}} label={param.paramName} InputLabelProps={{ shrink: true }} 
                        helpText={this.getHelperText(param.paramType)} fullWidth/> 
                    </div>
                :
                param.paramType === 'java.time.LocalDate'?
                    <div>
                        <TextInput type="date" onBlur={e=> {param.paramValue = e.target.value}} label={param.paramName} InputLabelProps={{ shrink: true }} fullWidth/> 
                    </div>
                :
                param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set') ?
                    this.renderListParam(param, index)
                :
                    <div>
                        <TextInput onBlur={e=> {param.paramValue = e.target.value}} label={param.paramName} helpText={this.getHelperText(param.paramType)} fullWidth/> 
                    </div>
                }
            </div> 
        
            </React.Fragment>
        );
    }

    renderListParam(param, index){
        return (
            <div>
                {
                    param.parameterizedType === 'net.corda.core.identity.Party'?
                        <React.Fragment>
                            
                                <Select label={param.paramName} onChange={e => this.updateListParam(param, e.target.value, true)} autoWidth>
                                    {
                                        this.props.parties.map((party, index) => {
                                            return(
                                                <Option key={index} value={party}>{party}</Option>
                                            );
                                        })
                                    }
                                </Select>
                                <TooltipWrapper>Select Parties</TooltipWrapper>
                         
                            {
                                this.state.paramList[param.paramName]?
                                this.state.paramList[param.paramName].map((value, idx) => {
                                        return (<div key={idx} className="list-selection">{value}<span onClick={()=>this.updateListParam(param, "", false, idx)}>X</span></div>)
                                    })
                                :null
                            }
                        </React.Fragment>
                    : param.parameterizedType === 'java.time.LocalDateTime' || param.parameterizedType === 'java.time.Instant'?
                        <React.Fragment>
                                <TextInput type="datetime-local" onBlur={e => this.updateListParam(param, e.target.value, true)} label={param.paramName} InputLabelProps={{ shrink: true }} 
                                helpText={this.getHelperText(param.paramType)} fullWidth/> 
                            {
                                this.state.paramList[param.paramName]?
                                this.state.paramList[param.paramName].map((value, idx) => {
                                        return (<div key={idx} className="list-selection">{value}<span onClick={()=>this.updateListParam(param, "", false, idx)}>X</span></div>)
                                    })
                                :null
                            }
                        </React.Fragment>    
                    :
                    param.parameterizedType === 'java.time.LocalDate'?
                        <React.Fragment>
                 
                                <TextInput type="date" onBlur={e => this.updateListParam(param, e.target.value, true)} label={param.paramName} InputLabelProps={{ shrink: true }} fullWidth/> 
                   
                            {
                                this.state.paramList[param.paramName]?
                                this.state.paramList[param.paramName].map((value, idx) => {
                                        return (<div key={idx} className="list-selection">{value}<span onClick={()=>this.updateListParam(param, "", false, idx)}>X</span></div>)
                                    })
                                :null
                            }
                        </React.Fragment>
                    :
                    param.hasParameterizedType && (param.paramType === 'java.util.List' || param.paramType === 'java.util.Set') ?
                        <div style={{color: 'red', marginTop: 10}}>Nested List Param is not supported!</div>
                    :
                        <React.Fragment>
                               <TextInput onBlur={e => this.updateListParam(param, e.target.value, true)} label={param.paramName} helpText={this.getHelperText(param.paramType)} fullWidth/> 
                            {
                                this.state.paramList[param.paramName]?
                                this.state.paramList[param.paramName].map((value, idx) => {
                                        return (<div key={idx} className="list-selection">{value}<span onClick={()=>this.updateListParam(param, "", false, idx)}>X</span></div>)
                                    })
                                :null
                            }
                        </React.Fragment>
                    }
            </div>
        );
    }

    // updateCmplxListParam(param, flag, idx){
    //     if(flag){
    //         let obj = JSON.parse(JSON.stringify(param.paramValue[0]));
    //         param.paramValue.push(obj);

    //         let keyVal = [];
    //         if(!(this.state.paramList[param.paramName] === undefined || this.state.paramList[param.paramName] === null)){
    //             keyVal[param.paramName] = this.state.paramList[param.paramName];
    //         }else{
    //             keyVal[param.paramName] = [];
    //         }
    //         if(keyVal[param.paramName].length === 0){
    //             obj.key = 0;
    //         }else{
    //             obj.key = keyVal[param.paramName][keyVal[param.paramName].length -1].key + 1;
    //         }
    //         keyVal[param.paramName].push(obj);
    //         this.setState({
    //             paramList: keyVal
    //         });
    //     }else{
    //         param.paramValue.splice(idx+1, 1);
    //         this.state.paramList[param.paramName].splice(idx, 1);
    //         let keyVal = [];
    //         keyVal[param.paramName] = this.state.paramList[param.paramName];
    //         this.setState({
    //             paramList: keyVal
    //         });
    //     }
    // }


    updateListParam(param, val, flag, idx) {
        if(flag){
            if(param.paramValue === undefined || param.paramValue === null)
                param.paramValue = []
            
                param.paramValue.push(val);
                let keyVal = [];
                keyVal[param.paramName] = param.paramValue;
                this.setState({
                    paramList: keyVal
                });
        }else{
            param.paramValue.splice(idx, 1);
            this.state.paramList[param.paramName].splice(idx, 1)
            let keyVal = [];
            keyVal[param.paramName] = this.state.paramList[param.paramName];
            this.setState({
                paramList: keyVal
            });

        }
    }

    getHelperText(paramType){
        switch(paramType){
            case 'net.corda.core.contracts.Amount':
                return 'Param Type: ' + paramType + ' eg: 100 USD';
            
            case 'java.lang.Boolean':
            case 'boolean':
                return 'Param Type: ' + paramType + ' eg: true or false';
            
            case 'java.time.LocalDateTime':
            case 'java.time.Instant':    
                return 'Param Type: ' + paramType + ' eg: 10/02/2020 10:12:30 AM';

            case 'net.corda.core.utilities.OpaqueBytes':
                return 'Param Type: ' + paramType + ', Enter String value';

            default:
                return 'Param Type: ' + paramType;
        }
    }

    render(){
        return(
            <div>
                <div className="page-title">
                    <PageHeader title="Transactions" size="small" className="custom-node-explorer-header" >
                        Transactions
                    </PageHeader>
                    <Button style={{float: "right"}} variant="primary" iconRight="Plus" size="small" onClick={this.handleOpen}>New Transaction</Button>
                    <Drawer
                        open={this.props.open}
                        onClose={this.handleClose}
                        style={{ overflow: "scroll" }}
                        withBackdrop
                        position="right"
                        closeOnOutsideClick
                        
                        >
                        <div className="flow-form">
                            <h3 id="simple-modal-title" className="flow-form-title">Select a Flow to Execute</h3>
                            <div style={{color: "red"}}>{this.props.registeredFlows.length === 0? 'No Flows Found! Make sure you have the cordapp directory set in the Settings Tab':null}</div>
                            <div className="form-body">
                                                      
                                            <Select label="Select A Flow to Execute" onChange={this.handleFlowSelection} value={null} >
                                                <Option key="empty" value=""></Option>
                                            {
                                                    this.props.registeredFlows.map((flow, index) => {
                                                        return(
                                                            <Option key={index} value={flow.flowName}>{flow.flowName}</Option>
                                                        );
                                                    })
                                                }
                                            </Select>
                                            <div style={{color: "red"}}>{this.state.selectedFlow.constructors && Object.keys(this.state.selectedFlow.constructors).length===0? 'No constructors with supported parameters found':null}</div>
                            
                            </div>

                            <div className="form-body">
                                  {   
                                    this.state.selectedFlow.constructors && Object.keys(this.state.selectedFlow.constructors).length>0?
                                                <Select label="Select A Constructor Type" labelId="flow-cons-select-label" onChange={this.handleFlowConstructorSelection} 
                                                value={this.state.selectedFlow.activeConstructor} fullWidth helpText="Select A Constructor Type">
                                                    {
                                                        Object.keys(this.state.selectedFlow.constructors).map((constructor, index) => {
                                                            return(
                                                                <Option key={index} value={constructor}>{constructor}</Option>
                                                            );
                                                        })
                                                    }
                                                </Select>
                                       
                                      :null
                                }
                                {
                                    this.renderParamForm(false)
                                }
                                
                               
                                    {
                                    this.props.flowResultMsg    ?
                                        <div style={{float: "left", fontSize: 14}}>
                                            <p style={{color: this.props.flowResultMsgType?"green":"red"}}>
                                                <span>{this.props.flowResultMsgType?'Flow Successful :': 'Flow Errored :'}</span>
                                                {this.props.flowResultMsg}
                                            </p>
                                        </div>
                                        :null
                                    }
                                {
                                    this.props.flowSelected && Object.keys(this.state.selectedFlow.constructors).length>0?
                                            <Button onClick={() => this.prepareFlowDataToStart()} style={{float: "right", marginTop: 10}} 
                                                    variant="primary" size="small" disabled={this.props.flowInFlight}>
                                                {this.props.flowInFlight?'Please Wait...':'Execute'}
                                            </Button>
                                    :null
                                }
                               
                                </div>
                            </div>
                        </Drawer>
                    </div>
                <div>
                <div className="transactions-container">
                            {
                                this.props.transactionList && this.props.transactionList.length > 0 ?
                                this.props.transactionList.map((trnx, index) => {
                                    return (
                                        <React.Fragment>
                                            <div key={index} style={{cursor: "pointer"}} onClick={() => this.showTrnxDetails(trnx, index)}
                                                className={`transaction-tile-container ${this.state.trnxDetail[index]?"open":null}`}>
                                              
                                                <div className="tile-header">
                                                    <div className="label">Transaction ID</div>
                                                    <span className="label-data">
                                                        {trnx.transactionId}
                                                    </span>
                                                    
                                                </div>
                                                <Row className="tile-body">
                                                    <Column lg={6}>
                                                        <div className="tile-features">
                                                            <div className="label">Input</div>
                                                            <span className="label-data">
                                                            {trnx.inputTypes? trnx.inputTypes.map((typeCnt, index) => {
                                                            return ( <div key={index}> {typeCnt.type + "(" + typeCnt.count + ")" }</div>);
                                                        }) :"-"}
                                                        </span>             
                                                    </div>                                           
                                                    </Column>
                                                    <Column lg={6}>
                                                        <div className="tile-features">
                                                            <div className="label">Output</div>
                                                                <span className="label-data">
                                                                {trnx.outputTypes && trnx.outputTypes.length > 0 ? trnx.outputTypes.map((typeCnt, index) => {
                                                                return ( <div key={index}> {typeCnt.type + "(" + typeCnt.count + ")" }</div>);
                                                            }) :"-"}
                                                                </span>
                                                        </div>                                                    
                                                    </Column>                                                                                                        
                                                </Row>
                                                 <div className="tile-footer">
                                                    <span className="label">Command:</span>
                                                    <span className="label-data-command">
                                                        {trnx.commands.map( (command, index) => {
                                                            return (<div key={index}>{command}</div>)
                                                        }
                                                    )}
                                                    </span>                                                    
                                                </div>                                             
                                            </div>
                                            {
                                               
                                                <Drawer style={{ backgroundColor: "#EEEEEE" }} open={this.state.isOpen}
                                                    withBackdrop 
                                                    position="right"
                                                    onClose={() => this.setState({ isOpen: false })}
                                                    closeOnOutsideClick
                                                    className="w-half"
                                                >
                                           
                                                    <div>
                                                        <Container spacing={0}>
                                                            <Column xs={5}>
                                                                <Card className="wrapper" title="Inputs">
                                                                    {
                                                                        trnx.inputs?
                                                                        trnx.inputs.map((input, idx) => {
                                                                            return (
                                                                                <div key={idx} className="content">
                                                                                    <div className="stitle">
                                                                                        <div>{input.type}</div>
                                                                                        <div style={{fontWeight: "normal", fontSize: 13}}>{input.stateRef.txhash} ({input.stateRef.index})</div>
                                                                                    </div>
                                                                                    {this.renderJson(input.state, 0)}
                                                                                </div>
                                                                            )
                                                                        }):
                                                                            <div className="content stripe"></div>
                                                                    }
                                                                </Card>
                                                            </Column>
                                                            <Column item xs={2}>
                                                                <div className="cmd-wrapper">
                                                                    <ForwardIcon className='icon-arrow' style={{color: "#DE0A1B", fontSize: 120}}></ForwardIcon>
                                                                    <div style={{position: "relative", top: -15}}>
                                                                        {trnx.commands.map( (command , index) => {
                                                                                return (<div key={index}>{command}</div>)
                                                                                }
                                                                            )
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </Column>
                                                            <Column item xs={5}>
                                                            <Card className="wrapper" title="Outputs">                                                                
                                                                {
                                                                    trnx.outputs && trnx.outputs.length > 0?
                                                                    trnx.outputs.map((output, idx) => {
                                                                        return (
                                                                            <div key={idx} className="content">
                                                                                <div className="stitle">
                                                                                    <div>{output.type}</div>
                                                                                    <div style={{fontWeight: "normal", fontSize: 13}}>{output.stateRef.txhash} ({output.stateRef.index})</div>
                                                                                </div>
                                                                                {this.renderJson(output.state, 0)}
                                                                            </div>    
                                                                        )
                                                                    }):<div className="content stripe"></div>
                                                                }
                                                            </Card>
                                                            </Column>
                                                            <Column item xs={12}>
                                                            <div className="wrapper" style={{marginTop: 20, minWidth: "auto", height: "auto"}}>
                                                                <div className="title">Signatures</div>
                                                                <div>
                                                                    {
                                                                        trnx.signers && trnx.signers.length > 0?
                                                                        trnx.signers.map((sig, idx) => {
                                                                            return (
                                                                                <div key={idx}>{sig.signature.bytes}<strong>({sig.partyName})</strong></div>
                                                                            )
                                                                        })
                                                                        :
                                                                        <div>Transaction has no signatures</div>
                                                                    }
                                                                </div>
                                                            </div>
                                                            </Column>
                                                        </Container>
                                                        
                                                    </div>
                                             
                                                </Drawer>
                                           
                                            }
                                        </React.Fragment>
                                    );
                                })
                                : 
                                    
                                        <div>No Data Found</div>
                                   
                            }
                            </div>
         
                    {
                    this.props.totalRecords?
                        <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={this.props.totalRecords}
                        rowsPerPage={this.state.page.pageSize}
                        page={this.state.page.offset}
                        onPageChange={this.handleChangePage}
                        onRowsPerPageChange={this.handleChangeRowsPerPage}
                        />
                        :null
                    }
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        registeredFlows: state.trnx.registeredFlows,
        flowParams: state.trnx.flowParams,
        transactionList: state.trnx.trnxList,
        totalRecords: state.trnx.trnxListPage,
        parties: state.trnx.parties,
        open: state.trnx.showTxPopup,
        flowSelected: state.trnx.isFlowSelected,
        flowInFlight: state.trnx.isFlowInFlight,
        flowResultMsg: state.trnx.flowMessage,
        flowResultMsgType: state.trnx.messageType
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchTrnxList: (page) => dispatch(ActionType.fetchTransactions(page)),
        startFlow: (flowInfo) => dispatch(ActionType.startFlow(flowInfo)),
        fetchFlowList: () => dispatch(ActionType.fetchFlows()),
        fetchParties: () => dispatch(ActionType.fetchParties()),
        loadFlowParams: (data) => dispatch({type: ActionType.LOAD_FLOW_PARAMS, data: data}),
        closeTxModal: () => dispatch({type: ActionType.CLOSE_TX_MODAL}),
        openTxModal: () => dispatch({type: ActionType.OPEN_TX_MODAL}),
        setFlowSelectionFlag: () => dispatch({type: ActionType.SET_FLOW_SELECTION_FLAG}),
        inFlightFLow: (flag) => dispatch({type: ActionType.SET_INFLIGHT_FLOW_FLAG, data: flag})

    }
}
  
export default connect(mapStateToProps, mapDispatchToProps)(TransactionExplorer);