import {hash$} from '@agnos-ui/common/utils';
import {useObservable} from '@agnos-ui/react/utils/stores';
import {Pagination} from '@agnos-ui/react/components/pagination';
import {WidgetsDefaultConfig} from '@agnos-ui/react/config';
import {useCallback} from 'react';

const PaginationHrefs = () => {
	const hash = useObservable(hash$);
	const pageNumber = +(hash.split('#')[1] ?? 4);

	const pageChange = useCallback((currentPage: number) => (location.hash = `#${hash.split('#')[0]}#${currentPage}`), []);

	const pageLink = useCallback((currentPage: number) => `#${hash.split('#')[0]}#${currentPage}`, []);

	return (
		<>
			<WidgetsDefaultConfig pagination={{collectionSize: 60}}>
				<p>A pagination with hrefs provided for each pagination element:</p>
				<p>
					Page hash: <small>{'#' + hash}</small>
				</p>
				<Pagination
					ariaLabel={'Page navigation with customized hrefs'}
					page={pageNumber}
					boundaryLinks={true}
					pageLink={pageLink}
					onPageChange={pageChange}
				/>
			</WidgetsDefaultConfig>
		</>
	);
};
export default PaginationHrefs;
