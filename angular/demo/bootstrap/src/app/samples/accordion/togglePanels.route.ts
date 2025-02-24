import {AgnosUIAngularModule} from '@agnos-ui/angular-bootstrap';
import {Component} from '@angular/core';
import BODY from '@agnos-ui/common/samples/accordion/body.txt';

@Component({
	imports: [AgnosUIAngularModule],
	template: `
		<div auAccordion #accordion="auAccordion">
			<div auAccordionItem auHeader="First panel" auId="first">{{ BODY }}</div>
			<div auAccordionItem auHeader="Second panel" auId="second" #itemTwo>{{ BODY }}</div>
		</div>
		<hr />
		<div class="d-flex flex-wrap gap-2">
			<button class="btn btn-sm btn-outline-primary" (click)="accordion.api.toggle('first')">Toggle first</button>
			<button class="btn btn-sm btn-outline-primary" (click)="itemTwo.api.toggle()">Toggle second</button>
			<button class="btn btn-sm btn-outline-primary" (click)="accordion.api.expandAll()">Expand all</button>
			<button class="btn btn-sm btn-outline-primary" (click)="accordion.api.collapseAll()">Collapse all</button>
		</div>
	`,
})
export default class AccordionComponent {
	BODY = BODY;
}
