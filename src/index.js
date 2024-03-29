const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const follow = require('./follow');
const stompClient = require('./websocket-listener')
const when = require('when');

class App extends React.Component {

    root ='/api';
	constructor(props) {
		super(props);
		this.state = {employees: [], attributes: [], page: 1, pageSize: 2, links: {}
		, loggedInManager: this.props.loggedInManager};
		this.updatePageSize = this.updatePageSize.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
		this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
		this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
	}


	// tag::update-page-size[]
	updatePageSize(pageSize) {
		if (pageSize !== this.state.pageSize) {
			this.loadFromServer(pageSize);
		}
	}
	// end::update-page-size[]
	
	componentDidMount() {
		this.loadFromServer(this.state.pageSize);
		stompClient.register([
			{route: '/topic/newEmployee', callback: this.refreshAndGoToLastPage},
			{route: '/topic/updateEmployee', callback: this.refreshCurrentPage},
			{route: '/topic/deleteEmployee', callback: this.refreshCurrentPage}
		]);
	}

	loadFromServer(pageSize) {
		var root = '/api';
		follow(client, root, [
			{rel: 'employees', params: {size: pageSize}}]
		).then(employeeCollection => {
			return client({
				method: 'GET',
				path: employeeCollection.entity._links.profile.href,
				headers: {'Accept': 'application/schema+json'}
			}).then(schema => {
			
				Object.keys(schema.entity.properties).forEach(function(property) {
					if (schema.entity.properties[property].hasOwnProperty('format') &&
					schema.entity.properties[property].format === 'uri'){
						delete schema.entity.properties[property];
					} else if (schema.entity.properties[property].hasOwnProperty('$ref')){
						delete schema.entity.properties[property];					
					}	
				});
				this.schema = schema.entity;
				this.links = employeeCollection.entity._links;
				return employeeCollection;
			});
		}).then(employeeCollection => {
			this.page = employeeCollection.entity.page;
			return employeeCollection.entity._embedded.employees.map(employee =>
					client({
						method: 'GET',
						path: employee._links.self.href
					})
			);
		}).then(employeePromises => {
			return when.all(employeePromises);
		}).done(employees => {
			this.setState({
				page: this.page,
				employees: employees,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: this.links
			});
		});
	}


	onCreate(newEmployee) {
		var root = '/api';
		follow(client, root, ['employees']).done(response => {
		client({
			method: 'POST',
			path: response.entity._links.self.href,
			entity: newEmployee,
			headers: {'Content-Type': 'application/json'}
		})
		})		
	}
	// end::create[]
	
	onUpdate(employee, updatedEmployee) {
		if(employee.entity.manager.name !==  undefined && employee.entity.manager.name === this.state.loggedInManager) {
			updatedEmployee["manager"] = employee.entity.manager;
			client({
				method: 'PUT',
				path: employee.entity._links.self.href,
				entity: updatedEmployee,
				headers: {
					'Content-Type': 'application/json',
					'If-Match': employee.headers.Etag
				}
			}).done(response => {
				/* Let the websocket handler update the state */
			}, response => {
				if (response.status.code === 403) {
					alert('ACCESS DENIED: You are not authorized to update ' +
						employee.entity._links.self.href);
				}
				if (response.status.code === 412) {
					alert('DENIED: Unable to update ' + employee.entity._links.self.href +
						'. Your copy is stale.');
				}
			});
		} else {
			alert("You are not authorized to update");
		}
	}
	
	onDelete(employee) {
		client({method: 'DELETE', path: employee.entity._links.self.href}
		).done(response => {/* let the websocket handle updating the UI */},
		response => {
			if (response.status.code === 403) {
				alert('ACCESS DENIED: You are not authorized to delete ' +
					employee.entity._links.self.href);
			}
		});
	}


	
	onNavigate(navUri) {
		client({
			method: 'GET',
			path: navUri
		}).then(employeeCollection => {
			this.links = employeeCollection.entity._links;

			return employeeCollection.entity._embedded.employees.map(employee =>
					client({
						method: 'GET',
						path: employee._links.self.href
					})
			);
		}).then(employeePromises => {
			return when.all(employeePromises);
		}).done(employees => {
			this.setState({
				page: this.page,
				employees: employees,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
	}
	// end::navigate[]
	
	refreshAndGoToLastPage(message) {
		var root = '/api';
		follow(client, root, [{
			rel: 'employees',
			params: {size: this.state.pageSize}
		}]).done(response => {
			if (response.entity._links.last !== undefined) {
				this.onNavigate(response.entity._links.last.href);
			} else {
				this.onNavigate(response.entity._links.self.href);
			}
		})
	}
	
	updatePageSize(pageSize) {
		if (pageSize !== this.state.pageSize){
			this.loadFromServer(pageSize)
		}
	}
	
	refreshCurrentPage(message) {
		var root = '/api';
		follow(client, root, [{
			rel: 'employees',
			params: {
				size: this.state.pageSize,
				page: this.state.page.number
			}
		}]).then(employeeCollection => {
			this.links = employeeCollection.entity._links;
			this.page = employeeCollection.entity.page;
	
			return employeeCollection.entity._embedded.employees.map(employee => {
				return client({
					method: 'GET',
					path: employee._links.self.href
				})
			});
		}).then(employeePromises => {
			return when.all(employeePromises);
		}).then(employees => {
			this.setState({
				page: this.page,
				employees: employees,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
	}

	render() {
		return (
			<div>
				<CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
				<EmployeeList page={this.state.page}
								employees={this.state.employees}
							  links={this.state.links}
							  pageSize={this.state.pageSize}
							  attributes={this.state.attributes}
							  onNavigate={this.onNavigate}
							  onUpdate={this.onUpdate}
							  onDelete={this.onDelete}
							  updatePageSize={this.updatePageSize}
								loggedInManager={this.props.loggedInManager}
							  />
			</div>
		)
	}
}

class EmployeeList extends React.Component{


	constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
		this.handleInput = this.handleInput.bind(this);
	}
	
	handleNavFirst(e){
	e.preventDefault();
	this.props.onNavigate(this.props.links.first.href);
}

handleNavPrev(e) {
	e.preventDefault();
	this.props.onNavigate(this.props.links.prev.href);
}

handleNavNext(e) {
	e.preventDefault();
	this.props.onNavigate(this.props.links.next.href);
}

handleNavLast(e) {
	e.preventDefault();
	this.props.onNavigate(this.props.links.last.href);
}

handleInput(e) {
	e.preventDefault();
	const pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
	if (/^[0-9]+$/.test(pageSize)) {
		this.props.updatePageSize(pageSize);
	} else {
		ReactDOM.findDOMNode(this.refs.pageSize).value =
			pageSize.substring(0, pageSize.length - 1);
	}
}

render() {

		const pageInfo = this.props.page.hasOwnProperty("number") ?
		
		<h3>Employees - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;
		
		const employees = this.props.employees.map(employee =>
			<Employee key={employee.entity._links.self.href}
					  employee={employee}
					  attributes={this.props.attributes}
					  onUpdate={this.props.onUpdate}
					  onDelete={this.props.onDelete}
					  loggedInManager={this.props.loggedInManager}
					  />
		);

	const navLinks = [];
	if ("first" in this.props.links) {
		navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
	}
	if ("prev" in this.props.links) {
		navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
	}
	if ("next" in this.props.links) {
		navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
	}
	if ("last" in this.props.links) {
		navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
	}

	return (
		<div>
			{pageInfo}
			<input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
			<table>
				<tbody>
					<tr>
						<th>First Name</th>
						<th>Last Name</th>
						<th>Description</th>
						<th>Manager</th>
						<th></th>
						<th></th>
					</tr>
					{employees}
				</tbody>
				
			</table>
			<div>
				{navLinks}
			</div>
		</div>
	)

	}
}

class Employee extends React.Component{

	constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
	}
	
	handleDelete() {
		this.props.onDelete(this.props.employee);
	}
	
	render() {
		return (
			<tr>
				<td>{this.props.employee.entity.firstName}</td>
				<td>{this.props.employee.entity.lastName}</td>
				<td>{this.props.employee.entity.description}</td>
				<td>{this.props.employee.entity.manager.name}</td>
				<td>
					<UpdateDialog employee={this.props.employee}
								  attributes={this.props.attributes}
								  onUpdate={this.props.onUpdate}
								  loggedInManager={this.props.loggedInManager}/>
				</td>
								<td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
			</tr>
		)
	}
}

class CreateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}


	handleSubmit(e) {
		e.preventDefault();
		const newEmployee = {};
		this.props.attributes.forEach(attribute => {
			newEmployee[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onCreate(newEmployee);

		// clear out the dialog's inputs
		this.props.attributes.forEach(attribute => {
			ReactDOM.findDOMNode(this.refs[attribute]).value = '';
		});

		// Navigate away from the dialog to hide it.
		window.location = "#";
	}

	render() {
		const inputs = this.props.attributes.map(attribute =>
			<p key={attribute}>
				<input type="text" placeholder={attribute}
				ref={attribute} className="field"/>
			</p>
		);

		return (
			<div>
				<a href="#createEmployee">Create</a>

				<div id="createEmployee" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Create new employee</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Create</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

}

class UpdateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const updatedEmployee = {};
		this.props.attributes.forEach(attribute => {
			updatedEmployee[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onUpdate(this.props.employee, updatedEmployee);
		window.location = "#";
	}

	render() {
		const inputs = this.props.attributes.map(attribute =>
			<p key={this.props.employee.entity[attribute]}>
				<input type="text" placeholder={attribute}
					   defaultValue={this.props.employee.entity[attribute]}
					   ref={attribute} className="field"/>
			</p>
		);

		const dialogId = "updateEmployee-" + this.props.employee.entity._links.self.href;
		
		const isManagerCorrect = this.props.employee.entity.manager.name == this.props.loggedInManager;
		
		if (isManagerCorrect === false) {
			return (
			<div>
				<a>Not your Employee</a>
			</div>			
			)
		} else {

		return (
			<div key={this.props.employee.entity._links.self.href}>
				<a href={"#" + dialogId}>Update</a>
				<div id={dialogId} className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Update an employee</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Update</button>
						</form>
					</div>
				</div>
			</div>
		)
		}
	}

};

ReactDOM.render(
	<App loggedInManager={document.getElementById('managername').innerHTML } />,
	document.getElementById('react')
)

